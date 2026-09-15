import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import gmailRouter from './routes/gmail';
import templatesRouter from './routes/templates';
import campaignsRouter from './routes/campaigns';
import sentEmailsRouter from './routes/sentEmails';
import contactsRouter from './routes/contacts';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth/gmail', gmailRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/sent-emails', sentEmailsRouter);
app.use('/api/contacts', contactsRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`\n🚀 Dor server running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   CORS origin: ${config.clientUrl}\n`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

export default app;
