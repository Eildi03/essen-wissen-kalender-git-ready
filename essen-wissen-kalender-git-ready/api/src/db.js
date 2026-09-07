import pg from 'pg';
import crypto from 'node:crypto';
import { config } from './config.js';
import { dbQueryDurationSeconds } from './metrics.js';

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


// Beispiel: generische Query-Funktion
export async function query(sql, params, meta = {}) {
  const start = process.hrtime.bigint();

  try {
    const result = await pool.query(sql, params);

    const durationNs = process.hrtime.bigint() - start;
    const durationSec = Number(durationNs) / 1e9;

    const labels = {
      operation: meta.operation || 'unknown',
      table: meta.table || 'unknown',
    };

    dbQueryDurationSeconds.observe(labels, durationSec);

    return result;
  } catch (error) {
        const labels = {
      operation: meta.operation || 'unknown',
      table: meta.table || 'unknown',
    };
    dbQueryErrorsTotal.inc(labels);
    // Option: Fehler separat zählen (Counter), hier nur weiterwerfen
    throw error;
  }
}