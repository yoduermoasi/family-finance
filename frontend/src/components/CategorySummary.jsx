import s from './CategorySummary.module.css';

export default function CategorySummary({ categories, transactions, totalBudget }) {
  const spent = Object.fromEntries(categories.map(c => [c.id, 0]));
  transactions.forEach(tx => {
    if (spent[tx.category] !== undefined) spent[tx.category] += tx.usdAmount || 0;
    else spent['extra'] = (spent['extra'] || 0) + (tx.usdAmount || 0);
  });

  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0);
  const pct = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <h3 className={s.title}>Monthly Budget</h3>
        <div className={s.totals}>
          <span className={s.totalSpent}>${totalSpent.toFixed(2)}</span>
          <span className={s.totalBudget}> / ${totalBudget?.toLocaleString()}</span>
          <span className={s[pct > 100 ? 'over' : pct > 80 ? 'warn' : 'ok']}>{pct}%</span>
        </div>
      </div>

      <div className={s.masterBar}>
        <div className={s.masterFill} style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? '#f87171' : pct > 80 ? '#fbbf24' : '#34d399' }} />
      </div>

      <table className={s.table}>
        <thead>
          <tr>
            <th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Used</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const s2 = spent[cat.id] || 0;
            const rem = cat.budget - s2;
            const p = Math.round((s2 / cat.budget) * 100);
            const cls = p > 100 ? 'over' : p > 80 ? 'warn' : 'ok';
            return (
              <tr key={cat.id}>
                <td>
                  <span className={s.dot} style={{ background: cat.color }} />
                  {cat.label}
                </td>
                <td>${cat.budget.toLocaleString()}</td>
                <td>${s2.toFixed(2)}</td>
                <td className={rem < 0 ? s.negRem : ''}>${rem.toFixed(2)}</td>
                <td>
                  <div className={s.barWrap}>
                    <div className={s.bar} style={{ width: `${Math.min(p, 100)}%`, background: cat.color, opacity: p > 100 ? 1 : 0.8 }} />
                    <span className={s[cls]}>{p}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
