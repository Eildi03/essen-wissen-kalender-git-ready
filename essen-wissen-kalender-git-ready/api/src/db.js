import pg from 'pg';
import crypto from 'node:crypto';
import { config } from './config.js';

const { Pool } = pg;
export const pool = new Pool({ connectionString: config.databaseUrl, ssl: config.pgSsl, max: config.poolMax, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, application_name: 'essen-wissen-kalender-api' });
export async function query(text, values = []) { return pool.query(text, values); }
export async function withTransaction(work, context = {}) {
  const client = await pool.connect(); const requestId = context.requestId || crypto.randomUUID();
  try { await client.query('BEGIN'); await client.query("SELECT set_config('app.user_id', $1, true), set_config('app.request_id', $2, true)", [context.userId || '', requestId]); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function closePool() { await pool.end(); }
export async function healthcheck() { const result = await pool.query('SELECT 1 AS ok'); return result.rows[0].ok === 1; }


