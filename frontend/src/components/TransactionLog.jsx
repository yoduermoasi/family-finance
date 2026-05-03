import { useState } from 'react';
import { api } from '../api/client';
import s from './TransactionLog.module.css';

const CAT_COLORS = {
  rent:'#6366f1', utilities:'#22d3ee', cellphone:'#a78bfa', groceries:'#34d399',
  fun:'#fb923c', therapy:'#f472b6', rothira:'#fbbf24', extra:'#94a3b8',
};

export default function TransactionLog({ transactions, categories, onUpdate, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [editCat, setEditCat] = useState('');
  const [editWhoId, setEditWhoId] = useState(null);
  const [editWho, setEditWho] = useState('');

  const saveEdit = async (id) => {
    const updated = await api.updateTransaction(id, { category: editCat, flagged: false });
    onUpdate(updated);
    setEditId(null);
  };

  const saveWho = async (id) => {
    const updated = await api.updateTransaction(id, { who: editWho });
    onUpdate(updated);
    setEditWhoId(null);
  };

  const remove = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.deleteTransaction(id);
    onDelete(id);
  };

  const catLabel = id => categories.find(c => c.id === id)?.label ?? id;

  return (
    <div className={s.wrap}>
      <h3 className={s.title}>Transactions <span className={s.count}>{transactions.length}</span></h3>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Date</th><th>Description</th><th>Category</th>
              <th>Amount</th><th>USD</th><th>Who</th><th>Source</th><th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={8} className={s.empty}>No transactions yet — add one above.</td></tr>
            )}
            {transactions.map(tx => (
              <tr key={tx.id} className={tx.flagged ? s.flagged : ''}>
                <td>{tx.date}</td>
                <td className={s.desc}>{tx.description}</td>
                <td>
                  {editId === tx.id ? (
                    <div className={s.editRow}>
                      <select value={editCat} onChange={e => setEditCat(e.target.value)}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <button className={s.save} onClick={() => saveEdit(tx.id)}>Save</button>
                      <button className={s.cancel} onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <span
                      className={s.catBadge}
                      style={{ background: CAT_COLORS[tx.category] + '22', color: CAT_COLORS[tx.category], borderColor: CAT_COLORS[tx.category] + '55' }}
                      onClick={() => { setEditId(tx.id); setEditCat(tx.category); }}
                      title="Click to edit"
                    >
                      {catLabel(tx.category)} {tx.flagged && '⚑'}
                    </span>
                  )}
                </td>
                <td className={tx.type === 'reimbursement' ? s.reimbursement : s.amount}>
                  {tx.type === 'reimbursement' ? '+' : ''}
                  {tx.currency === 'COP'
                    ? `$${tx.originalAmount?.toLocaleString()} COP`
                    : `$${tx.usdAmount?.toFixed(2)}`}
                </td>
                <td className={tx.type === 'reimbursement' ? s.reimbursement : s.amount}>
                  {tx.type === 'reimbursement' ? '+' : ''}${tx.usdAmount?.toFixed(2)}
                </td>
                <td>
                  {editWhoId === tx.id ? (
                    <div className={s.editRow}>
                      <select value={editWho} onChange={e => setEditWho(e.target.value)}>
                        <option value="Pablo">Pablo</option>
                        <option value="Camila">Camila</option>
                      </select>
                      <button className={s.save} onClick={() => saveWho(tx.id)}>Save</button>
                      <button className={s.cancel} onClick={() => setEditWhoId(null)}>✕</button>
                    </div>
                  ) : (
                    <span className={s.who} onClick={() => { setEditWhoId(tx.id); setEditWho(tx.who || 'Pablo'); }} title="Click to edit">
                      {tx.who}
                    </span>
                  )}
                </td>
                <td><span className={s.source}>{tx.source}</span></td>
                <td><button className={s.del} onClick={() => remove(tx.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
