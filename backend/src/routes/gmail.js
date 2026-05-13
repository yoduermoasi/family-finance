import { Router } from 'express';
import { getAuthUrl, exchangeCode, syncEmails } from '../services/gmail.js';
import { store } from '../db/store.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const router = Router();

router.get('/gmail/auth', (_req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/gmail/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect(`${FRONTEND_URL}?gmail=error`);
  try {
    await exchangeCode(code);
    res.redirect(`${FRONTEND_URL}?gmail=connected`);
  } catch (err) {
    console.error('Gmail callback error:', err);
    res.redirect(`${FRONTEND_URL}?gmail=error`);
  }
});

router.get('/gmail/status', async (_req, res) => {
  try {
    const settings = await store.getSettings();
    res.json({
      connected: !!settings.gmailConnected,
      lastSync: settings.gmailLastSync || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/gmail/sync', async (_req, res) => {
  try {
    const imported = await syncEmails();
    res.json({ imported: imported.length, transactions: imported });
  } catch (err) {
    if (err.code === 'GMAIL_DISCONNECTED') {
      return res.status(401).json({ error: 'gmail_disconnected' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
