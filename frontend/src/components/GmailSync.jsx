import { useState, useEffect } from 'react';
import { api } from '../api/client';
import s from './GmailSync.module.css';

export default function GmailSync({ onSynced }) {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getGmailStatus().then(setStatus).catch(() => {});

    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail') === 'connected') {
      setStatus(s => ({ ...s, connected: true }));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const data = await api.syncGmail();
      setResult(data.imported);
      if (data.imported > 0) onSynced?.();
      setStatus(s => ({ ...s, lastSync: new Date().toISOString() }));
    } catch (err) {
      setResult(-1);
    } finally {
      setSyncing(false);
    }
  }

  if (!status) return null;

  return (
    <div className={s.wrap}>
      {!status.connected ? (
        <a href={api.getGmailAuthUrl()} className={s.connectBtn}>
          Connect Gmail
        </a>
      ) : (
        <div className={s.connected}>
          <button className={s.syncBtn} onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync Gmail'}
          </button>
          {status.lastSync && (
            <span className={s.lastSync}>
              Last: {new Date(status.lastSync).toLocaleDateString()}
            </span>
          )}
          {result === -1 && <span className={s.error}>Sync failed</span>}
          {result >= 0 && <span className={s.ok}>{result} imported</span>}
        </div>
      )}
    </div>
  );
}
