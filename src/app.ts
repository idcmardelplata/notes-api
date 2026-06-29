import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import type { Pool } from 'pg';
import type { Client } from '@openfeature/server-sdk';
import { createNotesRouter } from './routes/notes.js';

export function createApp(db: Pool, featureFlagClient?: Client | null) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', async (_req: Request, res: Response) => {
    const enabled = await featureFlagClient?.getBooleanValue('enable-health', false) ?? false;


    if (!enabled) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({ status: 'ok' });
  });

  app.use('/api/notes', createNotesRouter(db));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
