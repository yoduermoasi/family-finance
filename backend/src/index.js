import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { connectDB } from './db/store.js';
import transactionsRouter from './routes/transactions.js';
import settingsRouter from './routes/settings.js';
import gmailRouter from './routes/gmail.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api', settingsRouter);
app.use('/api', gmailRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)))
  .catch(err => { console.error('Failed to connect to DB:', err); process.exit(1); });
