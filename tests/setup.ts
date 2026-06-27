import pg from 'pg';
import { runMigrations } from '../src/database/migrations.js';

const { Pool } = pg;

export async function getTestDb(): Promise<pg.Pool> {
  const pool = new Pool({
    host: process.env.DB_TEST_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_TEST_PORT || process.env.DB_PORT || '5432', 10),
    database: process.env.DB_TEST_NAME || 'notes_api_test',
    user: process.env.DB_TEST_USER || process.env.DB_USER || 'postgres',
    password: process.env.DB_TEST_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  });

  await pool.query('DROP TABLE IF EXISTS notes');
  await runMigrations(pool);

  return pool;
}
