const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getTransactions: (year, month) => {
    const params = new URLSearchParams();
    if (year)  params.set('year',  year);
    if (month) params.set('month', month);
    return req('GET', `/transactions?${params}`);
  },
  addTransaction:    (tx)      => req('POST',   '/transactions', tx),
  updateTransaction: (id, upd) => req('PATCH',  `/transactions/${id}`, upd),
  deleteTransaction: (id)      => req('DELETE', `/transactions/${id}`),
  getCategories:     ()        => req('GET', '/categories'),
  getExchangeRate:   ()        => req('GET', '/exchange-rate'),
  setRateOverride:   (rate)    => req('POST', '/exchange-rate/override', { rate }),
  getGmailStatus:    ()        => req('GET', '/gmail/status'),
  syncGmail:         ()        => req('POST', '/gmail/sync'),
  getGmailAuthUrl:   ()        => (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/gmail/auth',
};
