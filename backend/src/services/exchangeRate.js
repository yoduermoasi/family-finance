import fetch from 'node-fetch';
import { store } from '../db/store.js';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const TTL_MS  = 60 * 60 * 1000;

export async function getExchangeRate() {
  const settings = await store.getSettings();

  if (settings.manualRateOverride)
    return { rate: settings.manualRateOverride, source: 'manual' };

  const age = Date.now() - new Date(settings.exchangeRateUpdatedAt || 0).getTime();
  if (settings.exchangeRate && age < TTL_MS)
    return { rate: settings.exchangeRate, source: 'cached' };

  try {
    const res  = await fetch(API_URL);
    const json = await res.json();
    const rate = json.rates?.COP;
    if (!rate) throw new Error('COP rate missing');
    await store.updateSettings({ exchangeRate: rate, exchangeRateUpdatedAt: new Date().toISOString() });
    return { rate, source: 'live' };
  } catch (err) {
    if (settings.exchangeRate) return { rate: settings.exchangeRate, source: 'cached-fallback' };
    throw err;
  }
}

export function copToUsd(copAmount, rate) {
  return Math.round((copAmount / rate) * 100) / 100;
}
