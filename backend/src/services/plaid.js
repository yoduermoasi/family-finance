import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { store } from '../db/store.js';
import { autoCategrize } from '../db/categories.js';
import { v4 as uuid } from 'uuid';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(config);

export async function createLinkToken() {
  const response = await client.linkTokenCreate({
    user: { client_user_id: 'family-finance' },
    client_name: 'Family Finance',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  });
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken, institutionName) {
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });
  const { access_token, item_id } = response.data;

  const settings = await store.getSettings();
  const accounts = settings.plaidAccounts || [];
  accounts.push({ accessToken: access_token, itemId: item_id, institution: institutionName });
  await store.updateSettings({ plaidAccounts: accounts });

  return { itemId: item_id, institution: institutionName };
}

export async function syncAllAccounts() {
  const settings = await store.getSettings();
  const accounts = settings.plaidAccounts || [];
  if (!accounts.length) throw new Error('No accounts connected');

  const allImported = [];

  for (const account of accounts) {
    const imported = await syncAccount(account);
    allImported.push(...imported);
  }

  await store.updateSettings({ plaidLastSync: new Date().toISOString() });
  return allImported;
}

async function syncAccount(account) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const response = await client.transactionsGet({
    access_token: account.accessToken,
    start_date: startDate,
    end_date: endDate,
  });

  const imported = [];
  for (const tx of response.data.transactions) {
    const existing = await store.getTransactionByPlaidId(tx.transaction_id);
    if (existing) continue;

    const merchant = tx.merchant_name || tx.name || 'Unknown';
    const newTx = {
      id: uuid(),
      plaidId: tx.transaction_id,
      description: merchant,
      amount: Math.abs(tx.amount),
      date: tx.date,
      category: autoCategrize(merchant),
      source: 'plaid',
      institution: account.institution,
    };

    await store.addTransaction(newTx);
    imported.push(newTx);
  }

  return imported;
}
