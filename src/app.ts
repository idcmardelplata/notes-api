import express from 'express';
import cors from 'cors';
import type { Database } from 'sql.js';
import { createNotesRouter } from './routes/notes.js';

export function createApp(db: Database) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/notes', createNotesRouter(db));

  return app;
}
