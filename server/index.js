import { createPool } from 'mysql2/promise';
import { createAuthServer } from './auth/httpServer.js';

const databaseUrl = process.env.SUBSAVE_DATABASE_URL;
const port = Number(process.env.SUBSAVE_API_PORT ?? '3001');
if (!databaseUrl) throw new Error('Set SUBSAVE_DATABASE_URL in the server environment.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SUBSAVE_API_PORT must be a valid port.');

const database = createPool(databaseUrl);
try {
  await database.query('SELECT 1 FROM account_credentials LIMIT 0');
  await database.query('SELECT 1 FROM account_sessions LIMIT 0');
} catch (error) {
  await database.end();
  console.error('MySQL setup failed. Check the database URL and apply migrations 001 and 002.', error.code ?? error.name);
  process.exit(1);
}

const server = createAuthServer(database, { secureCookies: process.env.SUBSAVE_COOKIE_SECURE === 'true' });
server.on('error', async (error) => {
  console.error('Could not start the SubSave API:', error.code ?? error.name);
  await database.end();
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`SubSave account API listening on http://127.0.0.1:${port}`);
});
