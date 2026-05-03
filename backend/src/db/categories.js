export const CATEGORIES = [
  { id: 'rent',       label: 'Rent',                   budget: 1500, color: '#6366f1' },
  { id: 'utilities',  label: 'Gas / Electricity / WiFi', budget: 82,  color: '#22d3ee' },
  { id: 'cellphone',  label: 'Cellphone',               budget: 62,   color: '#a78bfa' },
  { id: 'groceries',  label: 'Groceries',               budget: 482,  color: '#34d399' },
  { id: 'fun',        label: 'Chill / Relax / Fun',     budget: 500,  color: '#fb923c' },
  { id: 'therapy',    label: 'Health Insurance',         budget: 240,  color: '#f472b6' },
  { id: 'rothira',    label: 'Roth IRA',                budget: 1500, color: '#fbbf24' },
  { id: 'extra',      label: 'Extra',                   budget: 69,   color: '#94a3b8' },
];

export const TOTAL_BUDGET = CATEGORIES.reduce((s, c) => s + c.budget, 0);

const RULES = [
  { keywords: ['rent', 'zelle rent'],                                          category: 'rent' },
  { keywords: ['at&t', 'verizon', 't-mobile', 'tmobile'],                      category: 'cellphone' },
  { keywords: ['pg&e', 'coned', 'electricity', 'wifi', 'internet', 'comcast', 'xfinity', 'gas bill'], category: 'utilities' },
  { keywords: ['whole foods', 'trader joe', 'kroger', 'safeway', 'grocery', 'supermarket', 'costco', 'sprouts'], category: 'groceries' },
  { keywords: ['netflix', 'spotify', 'restaurant', 'cinema', 'theater', 'bar ', 'hotel', 'airline', 'hulu', 'disney', 'uber eats', 'doordash', 'grubhub'], category: 'fun' },
  { keywords: ['therapist', 'therapy', 'psychology', 'counseling', 'counselling', 'health insurance', 'blue shield', 'blue cross', 'cigna', 'aetna', 'united health', 'anthem', 'kaiser', 'humana'], category: 'therapy' },
  { keywords: ['fidelity', 'vanguard', 'schwab', 'ira', 'roth'],               category: 'rothira' },
];

export function autoCategrize(merchant = '', learnedRules = []) {
  const m = merchant.toLowerCase();
  for (const rule of learnedRules) {
    if (m.includes(rule.merchant)) return rule.category;
  }
  for (const rule of RULES) {
    if (rule.keywords.some(k => m.includes(k))) return rule.category;
  }
  return 'extra';
}
