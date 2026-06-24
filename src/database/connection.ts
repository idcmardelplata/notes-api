import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data.db');

let db: SqlJsDatabase | null = null;

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.save();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
