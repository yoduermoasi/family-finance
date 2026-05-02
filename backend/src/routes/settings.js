import { Router } from 'express';
import { store } from '../db/store.js';
import { getExchangeRate } from '../services/exchangeRate.js';
import { CATEGORIES, TOTAL_BUDGET } from '../db/categories.js';

const router = Router();

router.get('/categories', (_req, res) => res.json({ categories: CATEGORIES, totalBudget: TOTAL_BUDGET }));

router.get('/exchange-rate', async (_req, res) => {
  try { res.json(await getExchangeRate()); }
  catch (err) { res.status(503).json({ error: err.message }); }
});

router.post('/exchange-rate/override', async (req, res) => {
  try {
    const { rate } = req.body;
    await store.updateSettings({ manualRateOverride: rate ? parseFloat(rate) : null });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
