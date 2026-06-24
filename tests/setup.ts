import initSqlJs, { type Database } from 'sql.js';
import { runMigrations } from '../src/database/migrations.js';

export async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  runMigrations(db);
  return db;
}
