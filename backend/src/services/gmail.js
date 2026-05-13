import { google } from 'googleapis';
import { store } from '../db/store.js';
import { autoCategrize } from '../db/categories.js';
import { v4 as uuid } from 'uuid';

const REDIRECT_URI = process.env.RENDER_EXTERNAL_URL
  ? `${process.env.RENDER_EXTERNAL_URL}/api/gmail/callback`
  : 'http://localhost:3001/api/gmail/callback';

function makeClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

export function getAuthUrl() {
  const client = makeClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
}

export async function exchangeCode(code) {
  const client = makeClient();
  const { tokens } = await client.getToken(code);
  await store.updateSettings({ gmailTokens: tokens, gmailConnected: true });
  return tokens;
}

export async function syncEmails() {
  const settings = await store.getSettings();
  if (!settings.gmailTokens) throw new Error('Gmail not connected');

  const client = makeClient();
  client.setCredentials(settings.gmailTokens);

  // Refresh token if needed
  client.on('tokens', async (tokens) => {
    const merged = { ...settings.gmailTokens, ...tokens };
    await store.updateSettings({ gmailTokens: merged });
  });

  const gmail = google.gmail({ version: 'v1', auth: client });

  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  let data;
  try {
    ({ data } = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${since} (from:no.reply.alerts@chase.com OR from:alertsp@notify.chase.com OR from:notifications@alerts.bankofamerica.com OR subject:transaction OR subject:purchase OR subject:charge OR subject:"you spent")`,
      maxResults: 200,
    }));
  } catch (err) {
    if (err.response?.data?.error === 'invalid_grant' || err.message?.includes('invalid_grant')) {
      await store.updateSettings({ gmailConnected: false, gmailTokens: null });
      const authErr = new Error('gmail_disconnected');
      authErr.code = 'GMAIL_DISCONNECTED';
      throw authErr;
    }
    throw err;
  }

  const messages = data.messages || [];
  const learnedRules = await store.getLearnedCategories();
  const imported = [];

  for (const msg of messages) {
    const { data: full } = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const tx = parseEmail(full);
    if (!tx) continue;

    // Skip duplicates and previously deleted transactions
    const existing = await store.getTransactionByGmailId(msg.id);
    if (existing) continue;
    const wasDeleted = await store.isGmailIdDeleted(msg.id);
    if (wasDeleted) continue;

    tx.gmailId = msg.id;
    tx.id = uuid();
    tx.category = autoCategrize(tx.description, learnedRules);
    tx.usdAmount = tx.amount;
    tx.originalAmount = tx.amount;
    tx.currency = 'USD';
    tx.who = 'Pablo';
    tx.type = 'expense';
    tx.flagged = false;
    tx.createdAt = new Date().toISOString();
    await store.addTransaction(tx);
    imported.push(tx);
  }

  await store.updateSettings({ gmailLastSync: new Date().toISOString() });
  return imported;
}

function parseEmail(msg) {
  const headers = msg.payload?.headers || [];
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const dateHeader = headers.find(h => h.name === 'Date')?.value;
  const date = dateHeader ? new Date(dateHeader).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const body = extractBody(msg.payload);

  const amountMatch =
    body.match(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/i) ||
    body.match(/USD\s*(\d{1,6}(?:[.,]\d{2})?)/i) ||
    subject.match(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/i);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(',', ''));
  if (!amount || amount <= 0) return null;

  // Try body patterns first
  const bodyMerchant =
    body.match(/(?:purchase at|charged at|used at|transaction at)\s+([A-Za-z0-9\s&'.*,-]{2,40})/i) ||
    body.match(/(?:at|to|from|with|merchant|store|retailer)[:\s]+([A-Za-z0-9\s&'.*,-]{2,40}?)(?:\s*[\n\r$|]|on\s|\d{4})/i);

  // Try subject patterns: "You made a $X.XX [purchase] at/with MERCHANT"
  const subjectMerchant = !bodyMerchant &&
    subject.match(/(?:at|with|from)\s+([A-Za-z0-9\s&'.*,-]{2,40}?)(?:\s*$|\s+on\s|\s*\d)/i);

  const description = bodyMerchant
    ? bodyMerchant[1].trim()
    : subjectMerchant
      ? subjectMerchant[1].trim().replace(/\s+Amount\s*$/i, '').replace(/\s*\*\s*PENDING\s*$/i, '').trim()
      : subject
          .replace(/you\s+made\s+a?\s+\$?[\d.,]+\s+(?:purchase\s+)?(?:at|with|from)\s+/i, '')
          .replace(/transaction|purchase|charge|payment|receipt|\$[\d.,]+/gi, '')
          .trim().slice(0, 40) || 'Email import';

  return { amount, description, date, source: 'gmail' };
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return stripHtml(Buffer.from(payload.body.data, 'base64').toString('utf-8'));
  }
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain) { const t = extractBody(plain); if (t) return t; }
    for (const part of payload.parts) {
      const t = extractBody(part);
      if (t) return t;
    }
  }
  return '';
}
