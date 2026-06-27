import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

const RETRY_DELAY = 1000;
const MAX_RETRIES = 10;

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDatabase(): Promise<pg.Pool> {
  if (pool) return pool;

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'notes_api',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await pool.query('SELECT 1');
      return pool;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        pool = null;
        throw err;
      }
      console.log(`DB connection attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY}ms...`);
      await wait(RETRY_DELAY);
    }
  }

  throw new Error('Failed to connect to database');
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
