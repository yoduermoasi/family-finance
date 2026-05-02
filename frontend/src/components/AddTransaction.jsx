import { useState } from 'react';
import { api } from '../api/client';
import s from './AddTransaction.module.css';

const TODAY = new Date().toISOString().slice(0, 10);

export default function AddTransaction({ categories, onAdded }) {
  const [form, setForm] = useState({
    date: TODAY, description: '', category: '', amount: '', currency: 'USD', who: 'Pablo',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tx = await api.addTransaction(form);
      onAdded(tx);
      setForm(f => ({ ...f, description: '', amount: '', category: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={s.form} onSubmit={submit}>
      <h3 className={s.title}>Add Transaction</h3>
      {error && <p className={s.error}>{error}</p>}
      <div className={s.grid}>
        <label className={s.field}>
          <span>Date</span>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </label>
        <label className={s.field}>
          <span>Description / Merchant</span>
          <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Whole Foods" required />
        </label>
        <label className={s.field}>
          <span>Amount</span>
          <input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
        </label>
        <label className={s.field}>
          <span>Currency</span>
          <select value={form.currency} onChange={e => set('currency', e.target.value)}>
            <option value="USD">USD</option>
            <option value="COP">COP</option>
          </select>
        </label>
        <label className={s.field}>
          <span>Category</span>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Auto-detect</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className={s.field}>
          <span>Who</span>
          <select value={form.who} onChange={e => set('who', e.target.value)}>
            <option value="Pablo">Pablo</option>
            <option value="Camila">Camila</option>
          </select>
        </label>
      </div>
      <button className={s.submit} type="submit" disabled={saving}>
        {saving ? 'Saving…' : '+ Add Transaction'}
      </button>
    </form>
  );
}
