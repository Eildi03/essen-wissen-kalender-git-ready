// tests/utils/db-test-helpers.js
import { pool } from '../../src/db.js';
import { hashPassword } from '../../src/auth.js';
import { v4 as uuid } from 'uuid';

/**
 * Löscht alle Daten aus den wichtigsten Tabellen (für einen sauberen Testzustand).
 * Vorsicht: nur in der Test-Datenbank verwenden.
 */
export async function resetDatabase() {
  await pool.query('TRUNCATE essen_wissen.user_roles CASCADE');
  await pool.query('TRUNCATE essen_wissen.app_users CASCADE');
  await pool.query('TRUNCATE essen_wissen.events CASCADE');
  await pool.query('TRUNCATE essen_wissen.locations CASCADE');
}

/**
 * Legt einen Test-Benutzer mit Rollen an und gibt sein Objekt zurück.
 *
 * @param {{ email: string, password: string, roles?: string[] }} opts
 */
export async function setupTestUser(opts) {
  const {
    email = 'test@example.org',
    password = 'geheim',
    roles = ['planner'],
  } = opts;

  const userId = uuid();
  const passwordHash = await hashPassword(password);

  await pool.query(
    `
    INSERT INTO essen_wissen.app_users (id, email, password_hash, is_active)
    VALUES ($1, $2, $3, true)
    `,
    [userId, email, passwordHash],
  );

  for (const role of roles) {
    await pool.query(
      `
      INSERT INTO essen_wissen.user_roles (user_id, role)
      VALUES ($1, $2)
      `,
      [userId, role],
    );
  }

  return { id: userId, email, roles };
}

/**
 * Legt einen einfachen öffentlichen Event-Eintrag für Tests an.
 *
 * @param {{ title?: string, type?: 'bus'|'kitchen', startsAt: string, endsAt: string }} opts
 */
export async function setupTestEvent(opts) {
  const {
    title = 'Test-Event',
    type = 'bus',
    startsAt,
    endsAt,
  } = opts;

  const eventId = uuid();

  await pool.query(
    `
    INSERT INTO essen_wissen.events (id, title, type, starts_at, ends_at, is_deleted, is_public)
    VALUES ($1, $2, $3, $4, $5, false, true)
    `,
    [eventId, title, type, startsAt, endsAt],
  );

  return { id: eventId, title, type, startsAt, endsAt };
}