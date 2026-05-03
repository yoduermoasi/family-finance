import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { api } from '../api/client';
import s from './PlaidConnect.module.css';

function LinkButton({ onSuccess }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    api.plaidCreateLinkToken().then(({ link_token }) => setToken(link_token)).catch(() => {});
  }, []);

  const onPlaidSuccess = useCallback((publicToken, metadata) => {
    api.plaidExchangeToken(publicToken, metadata.institution?.name || 'Bank')
      .then(onSuccess)
      .catch(console.error);
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({ token, onSuccess: onPlaidSuccess });

  if (!token) return null;

  return (
    <button className={s.connectBtn} onClick={() => open()} disabled={!ready}>
      + Connect Bank
    </button>
  );
}

export default function PlaidConnect({ onSynced }) {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    api.plaidStatus().then(setStatus).catch(() => {});
  }, []);

  function handleConnected() {
    api.plaidStatus().then(setStatus);
    setShowLink(false);
  }

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const data = await api.plaidSync();
      setResult(data.imported);
      if (data.imported > 0) onSynced?.();
      setStatus(s => ({ ...s, lastSync: new Date().toISOString() }));
    } catch {
      setResult(-1);
    } finally {
      setSyncing(false);
    }
  }

  if (!status) return null;

  const hasAccounts = status.accounts?.length > 0;

  return (
    <div className={s.wrap}>
      {showLink && <LinkButton onSuccess={handleConnected} />}

      {!showLink && (
        <button className={s.addBtn} onClick={() => setShowLink(true)}>
          {hasAccounts ? '+ Add Account' : '+ Connect Bank'}
        </button>
      )}

      {hasAccounts && (
        <div className={s.right}>
          <span className={s.accounts}>
            {status.accounts.map(a => a.institution).join(', ')}
          </span>
          <button className={s.syncBtn} onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          {status.lastSync && (
            <span className={s.lastSync}>
              {new Date(status.lastSync).toLocaleDateString()}
            </span>
          )}
          {result === -1 && <span className={s.error}>Failed</span>}
          {result >= 0 && <span className={s.ok}>{result} imported</span>}
        </div>
      )}
    </div>
  );
}
