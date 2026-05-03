import { MongoClient, ObjectId } from 'mongodb';

let client;
let db;

export async function connectDB() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('family-finance');
  console.log('Connected to MongoDB');
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not connected — call connectDB() first');
  return db;
}

export const store = {
  async getTransactions(year, month) {
    const col = getDB().collection('transactions');
    const filter = {};
    if (year !== undefined) {
      const start = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
      const end = month
        ? new Date(year, month, 1)
        : new Date(year + 1, 0, 1);
      filter.date = { $gte: start.toISOString().slice(0, 10), $lt: end.toISOString().slice(0, 10) };
    }
    return col.find(filter).sort({ date: -1 }).toArray();
  },

  async addTransaction(tx) {
    const col = getDB().collection('transactions');
    await col.insertOne(tx);
    return tx;
  },

  async updateTransaction(id, updates) {
    const col = getDB().collection('transactions');
    const result = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result;
  },

  async getTransactionByPlaidId(plaidId) {
    const col = getDB().collection('transactions');
    return col.findOne({ plaidId });
  },

  async getTransactionByGmailId(gmailId) {
    const col = getDB().collection('transactions');
    return col.findOne({ gmailId });
  },

  async deleteTransaction(id) {
    const col = getDB().collection('transactions');
    const result = await col.deleteOne({ id });
    return result.deletedCount > 0;
  },

  async getSettings() {
    const col = getDB().collection('settings');
    return (await col.findOne({ _id: 'global' })) || {};
  },

  async updateSettings(updates) {
    const col = getDB().collection('settings');
    await col.updateOne(
      { _id: 'global' },
      { $set: updates },
      { upsert: true }
    );
    return this.getSettings();
  },
};
