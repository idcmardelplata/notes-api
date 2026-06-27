import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import type { Pool } from 'pg';
import { createNotesRouter } from './routes/notes.js';

export function createApp(db: Pool) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/notes', createNotesRouter(db));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
