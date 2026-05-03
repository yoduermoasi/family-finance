import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../db/store.js';
import { autoCategrize } from '../db/categories.js';
import { getExchangeRate, copToUsd } from '../services/exchangeRate.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const year  = req.query.year  ? parseInt(req.query.year)  : undefined;
    const month = req.query.month ? parseInt(req.query.month) : undefined;
    res.json(await store.getTransactions(year, month));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, description, category, amount, currency = 'USD', who, source = 'manual', type = 'expense' } = req.body;
    if (!date || !description || !amount || !who)
      return res.status(400).json({ error: 'date, description, amount, who are required' });

    let usdAmount = parseFloat(amount);
    let originalAmount = usdAmount;

    if (currency === 'COP') {
      const { rate } = await getExchangeRate();
      originalAmount = parseFloat(amount);
      usdAmount = copToUsd(originalAmount, rate);
    }

    const tx = {
      id: uuid(),
      date,
      description,
      category: category || autoCategrize(description),
      originalAmount,
      currency,
      usdAmount,
      who,
      source,
      type,
      flagged: !category,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(await store.addTransaction(tx));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await store.updateTransaction(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await store.deleteTransaction(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
