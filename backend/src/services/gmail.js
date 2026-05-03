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
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${since} (subject:transaction OR subject:purchase OR subject:charge OR subject:payment OR subject:receipt OR subject:"you spent")`,
    maxResults: 100,
  });

  const messages = data.messages || [];
  const imported = [];

  for (const msg of messages) {
    const { data: full } = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const tx = parseEmail(full);
    if (!tx) continue;

    // Skip duplicates by gmail message id
    const existing = await store.getTransactionByGmailId(msg.id);
    if (existing) continue;

    tx.gmailId = msg.id;
    tx.id = uuid();
    tx.category = autoCategrize(tx.description);
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

  // Try to extract amount
  const amountMatch =
    body.match(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/i) ||
    body.match(/USD\s*(\d{1,6}(?:[.,]\d{2})?)/i) ||
    subject.match(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/i);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(',', ''));
  if (!amount || amount <= 0) return null;

  // Try to extract merchant
  const merchantMatch =
    body.match(/(?:at|to|from|merchant|store|retailer)[:\s]+([A-Za-z0-9\s&'.,-]{2,40}?)(?:\s*[\n\r$|*]|on\s|\d{4})/i) ||
    body.match(/(?:purchase at|charged at|used at)\s+([A-Za-z0-9\s&'.,-]{2,40})/i);

  const description = merchantMatch
    ? merchantMatch[1].trim()
    : subject.replace(/transaction|purchase|charge|payment|receipt|\$/gi, '').trim().slice(0, 40) || 'Email import';

  return { amount, description, date, source: 'gmail' };
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }
  return '';
}
