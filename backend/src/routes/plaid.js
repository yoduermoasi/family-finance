import { Router } from 'express';
import { createLinkToken, exchangePublicToken, syncAllAccounts } from '../services/plaid.js';
import { store } from '../db/store.js';

const router = Router();

router.post('/plaid/create-link-token', async (_req, res) => {
  try {
    const linkToken = await createLinkToken();
    res.json({ link_token: linkToken });
  } catch (err) {
    console.error('Plaid create-link-token error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/plaid/exchange-token', async (req, res) => {
  try {
    const { public_token, institution } = req.body;
    const result = await exchangePublicToken(public_token, institution);
    res.json(result);
  } catch (err) {
    console.error('Plaid exchange-token error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/plaid/status', async (_req, res) => {
  try {
    const settings = await store.getSettings();
    const accounts = (settings.plaidAccounts || []).map(a => ({
      itemId: a.itemId,
      institution: a.institution,
    }));
    res.json({ accounts, lastSync: settings.plaidLastSync || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plaid/sync', async (_req, res) => {
  try {
    const imported = await syncAllAccounts();
    res.json({ imported: imported.length, transactions: imported });
  } catch (err) {
    console.error('Plaid sync error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
