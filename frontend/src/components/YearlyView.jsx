import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import s from './YearlyView.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '2px solid #0A0A0A',
  borderRadius: 0, color: '#0A0A0A', fontSize: 13, fontWeight: 600,
};

export default function YearlyView({ transactions, categories, totalBudget, year }) {
  const annualBudget = totalBudget * 12;

  // Build month-by-month totals
  const months = MONTHS.map((name, i) => {
    const monthNum = i + 1;
    const txs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === monthNum;
    });
    const spent = txs.reduce((s, t) => s + (t.usdAmount || 0), 0);
    return { name, monthNum, spent, txCount: txs.length };
  });

  const totalSpent = months.reduce((s, m) => s + m.spent, 0);
  const pct = annualBudget ? Math.round((totalSpent / annualBudget) * 100) : 0;

  // Per-category per-month breakdown
  const catMonthData = categories.map(cat => {
    const byMonth = months.map(m => {
      const spent = transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.category === cat.id && d.getMonth() + 1 === m.monthNum;
        })
        .reduce((s, t) => s + (t.usdAmount || 0), 0);
      return spent;
    });
    const total = byMonth.reduce((s, v) => s + v, 0);
    const annualBudgetCat = cat.budget * 12;
    return { ...cat, byMonth, total, annualBudgetCat };
  });

  // Bar chart data: monthly totals + budget line
  const barData = months.map(m => ({
    name: m.name,
    spent: parseFloat(m.spent.toFixed(2)),
    budget: totalBudget,
  }));

  const statusCls = pct > 100 ? s.over : pct > 80 ? s.warn : s.ok;

  return (
    <div className={s.wrap}>
      {/* ── YEAR HEADER ── */}
      <div className={s.yearHeader}>
        <div>
          <div className={s.yearLabel}>Year in Review</div>
          <div className={s.yearNum}>{year}</div>
        </div>
        <div className={s.yearTotals}>
          <span className={s.spent}>${totalSpent.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
          <span className={s.budget}> / ${annualBudget.toLocaleString()} annual</span>
          <span className={statusCls}>{pct}%</span>
        </div>
      </div>

      {/* ── MONTHLY TOTALS BAR CHART ── */}
      <div className={s.chartBlock}>
        <div className={s.chartTitle}>Monthly Spending vs Budget</div>
        <div className={s.chartBody}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0CDC4" />
              <XAxis dataKey="name" tick={{ fill: '#5A5550', fontSize: 12, fontWeight: 700 }} />
              <YAxis tick={{ fill: '#5A5550', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `$${v.toFixed(2)}`} />
              <ReferenceLine y={totalBudget} stroke="#D93B3B" strokeDasharray="6 3" strokeWidth={2} label={{ value: 'Budget', fill: '#D93B3B', fontSize: 11, fontWeight: 700 }} />
              <Bar dataKey="spent" fill="#3AABDB" stroke="#0A0A0A" strokeWidth={1} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── MONTH-BY-MONTH TABLE ── */}
      <div className={s.tableBlock}>
        <div className={s.tableTitle}>Month-by-Month Breakdown</div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Month</th>
                {categories.map(c => (
                  <th key={c.id}>
                    <span className={s.catDot} style={{ background: c.color }} />
                    {c.label.split(' / ')[0]}
                  </th>
                ))}
                <th>Total</th>
                <th>vs Budget</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const p = totalBudget ? Math.round((m.spent / totalBudget) * 100) : 0;
                const rowCls = m.spent === 0 ? s.emptyMonth : p > 100 ? s.rowOver : p > 80 ? s.rowWarn : '';
                return (
                  <tr key={m.name} className={rowCls}>
                    <td className={s.monthCell}>{m.name}</td>
                    {catMonthData.map(cat => (
                      <td key={cat.id} className={s.numCell}>
                        {cat.byMonth[i] > 0 ? `$${cat.byMonth[i].toFixed(0)}` : <span className={s.zero}>—</span>}
                      </td>
                    ))}
                    <td className={s.totalCell}>${m.spent.toFixed(0)}</td>
                    <td>
                      <div className={s.miniBarWrap}>
                        <div
                          className={s.miniBar}
                          style={{
                            width: `${Math.min(p, 100)}%`,
                            background: p > 100 ? '#D93B3B' : p > 80 ? '#F5D500' : '#3AABDB',
                          }}
                        />
                        <span className={s.pct}>{p}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={s.footRow}>
                <td className={s.monthCell}>TOTAL</td>
                {catMonthData.map(cat => (
                  <td key={cat.id} className={s.numCell}>${cat.total.toFixed(0)}</td>
                ))}
                <td className={s.totalCell}>${totalSpent.toFixed(0)}</td>
                <td className={statusCls}>{pct}%</td>
              </tr>
              <tr className={s.budgetRow}>
                <td className={s.monthCell}>BUDGET</td>
                {catMonthData.map(cat => (
                  <td key={cat.id} className={s.numCell}>${cat.annualBudgetCat.toLocaleString()}</td>
                ))}
                <td className={s.totalCell}>${annualBudget.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
