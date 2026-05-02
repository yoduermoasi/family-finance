import { useState, useEffect } from 'react';
import { api } from '../api/client';
import s from './ExchangeRateBar.module.css';

export default function ExchangeRateBar() {
  const [rateData, setRateData] = useState(null);
  const [override, setOverride] = useState('');
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try { setRateData(await api.getExchangeRate()); } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 60 * 60 * 1000); return () => clearInterval(t); }, []);

  const applyOverride = async () => {
    await api.setRateOverride(override || null);
    await load();
    setEditing(false);
    setOverride('');
  };

  if (!rateData) return null;

  return (
    <div className={s.bar}>
      <span className={s.label}>Exchange Rate</span>
      <span className={s.rate}>1 USD = {rateData.rate?.toLocaleString()} COP</span>
      <span className={s.source}>{rateData.source}</span>
      {!editing ? (
        <button className={s.btn} onClick={() => setEditing(true)}>Override</button>
      ) : (
        <div className={s.overrideForm}>
          <input
            className={s.input}
            type="number"
            placeholder="Enter rate"
            value={override}
            onChange={e => setOverride(e.target.value)}
          />
          <button className={s.btn} onClick={applyOverride}>Set</button>
          <button className={s.btnGhost} onClick={() => { applyOverride(); setOverride(''); }}>Clear override</button>
        </div>
      )}
    </div>
  );
}
