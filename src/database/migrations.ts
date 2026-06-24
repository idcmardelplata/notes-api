import type { Database } from 'sql.js';

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      tags       TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
