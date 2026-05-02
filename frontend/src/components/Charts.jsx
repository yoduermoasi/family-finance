import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import s from './Charts.module.css';

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '2px solid #0A0A0A', borderRadius: 0,
  color: '#0A0A0A', fontSize: 13, fontWeight: 600,
};

export default function Charts({ categories, transactions }) {
  // Bar chart: budget vs spent per category
  const barData = categories.map(cat => {
    const spent = transactions
      .filter(t => t.category === cat.id)
      .reduce((s, t) => s + (t.usdAmount || 0), 0);
    return { name: cat.label.split(' / ')[0], budget: cat.budget, spent: parseFloat(spent.toFixed(2)), color: cat.color };
  });

  // Line chart: daily cumulative spend this month
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  const lineData = sorted.map(t => {
    cum += t.usdAmount || 0;
    return { date: t.date.slice(5), total: parseFloat(cum.toFixed(2)) };
  });

  return (
    <div className={s.wrap}>
      <div className={s.chart}>
        <h4 className={s.chartTitle}>Spending vs Budget by Category</h4>
        <div className={s.chartBody}><ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8D5CC" />
            <XAxis dataKey="name" tick={{ fill: '#6B6760', fontSize: 11, fontWeight: 700 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#6B6760', fontSize: 11, fontWeight: 600 }} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `$${v}`} />
            <Bar dataKey="budget" fill="#EEECEA" name="Budget" stroke="#D8D5CC" strokeWidth={1} />
            <Bar dataKey="spent" name="Spent" fill="#3AABDB" stroke="#0A0A0A" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer></div>
      </div>

      <div className={s.chart}>
        <h4 className={s.chartTitle}>Cumulative Spend This Period</h4>
        <div className={s.chartBody}><ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8D5CC" />
            <XAxis dataKey="date" tick={{ fill: '#6B6760', fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fill: '#6B6760', fontSize: 11, fontWeight: 600 }} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `$${v}`} />
            <Line type="monotone" dataKey="total" stroke="#E8449A" strokeWidth={3} dot={false} name="Total Spent" />
          </LineChart>
        </ResponsiveContainer></div>
      </div>
    </div>
  );
}
