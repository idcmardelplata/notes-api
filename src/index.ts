import { getDatabase, closeDatabase } from './database/connection.js';
import { runMigrations } from './database/migrations.js';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  const db = await getDatabase();
  await runMigrations(db);

  const app = createApp(db);

  const server = app.listen(PORT, () => {
    console.log(`Notes API running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
