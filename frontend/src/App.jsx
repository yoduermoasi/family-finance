import { useState, useEffect } from 'react';
import { api } from './api/client';
import ExchangeRateBar from './components/ExchangeRateBar';
import AddTransaction from './components/AddTransaction';
import TransactionLog from './components/TransactionLog';
import CategorySummary from './components/CategorySummary';
import Charts from './components/Charts';
import YearlyView from './components/YearlyView';
import caballo from './assets/caballo.png';
import s from './App.module.css';

const NOW = new Date();

export default function App() {
  const [categories, setCategories]   = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [year, setYear]   = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [view, setView]   = useState('month');
  const [tab, setTab]     = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(({ categories, totalBudget }) => {
      setCategories(categories);
      setTotalBudget(totalBudget);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const args = view === 'month' ? [year, month] : [year];
    api.getTransactions(...args)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [year, month, view]);

  const onAdded  = tx => { setTransactions(prev => [tx, ...prev]); setTab('transactions'); };
  const onUpdate = tx => setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
  const onDelete = id => setTransactions(prev => prev.filter(t => t.id !== id));

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [2024, 2025, 2026];

  return (
    <div className={s.app}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <img src={caballo} className={s.mascot} alt="caballo perrro mascot" />
          <div className={s.logoBlock}>
            <h1 className={s.logo}>Family Finance</h1>
            <span className={s.subtitle}>Pablo & Camila</span>
          </div>
        </div>
        <div className={s.headerRight}>
          <ExchangeRateBar />
        </div>
      </header>

      <div className={s.controls}>
        <div className={s.viewToggle}>
          <button className={view === 'month' ? s.active : ''} onClick={() => setView('month')}>Monthly</button>
          <button className={view === 'year'  ? s.active : ''} onClick={() => setView('year')}>Yearly</button>
        </div>
        <div className={s.timePicker}>
          <select value={year} onChange={e => setYear(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {view === 'month' && (
            <select value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      <nav className={s.tabs}>
        {[
          { id: 'overview',     label: '📊 Overview' },
          { id: 'transactions', label: '📋 Transactions' },
          { id: 'add',          label: '+ Add' },
        ].map(t => (
          <button key={t.id} className={tab === t.id ? s.activeTab : s.tab} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className={s.main}>
        {loading && <p className={s.loading}>Loading…</p>}

        {!loading && tab === 'overview' && view === 'month' && (
          <div className={s.stack}>
            <CategorySummary categories={categories} transactions={transactions} totalBudget={totalBudget} />
            <Charts categories={categories} transactions={transactions} />
          </div>
        )}

        {!loading && tab === 'overview' && view === 'year' && (
          <YearlyView
            transactions={transactions}
            categories={categories}
            totalBudget={totalBudget}
            year={year}
          />
        )}

        {!loading && tab === 'transactions' && (
          <TransactionLog
            transactions={transactions}
            categories={categories}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )}

        {tab === 'add' && (
          <AddTransaction categories={categories} onAdded={onAdded} />
        )}
      </main>
    </div>
  );
}
