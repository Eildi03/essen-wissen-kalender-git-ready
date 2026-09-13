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
 * @param {{ email: string, password: string, firstName?: string, lastName?: string, roles?: string[] }} opts
 */
export async function setupTestUser(opts) {
  const {
    email = 'test@example.org',
    password = 'geheim',
    firstName = 'Test',
    lastName = 'Nutzer',
    roles = ['internal_reader'],
  } = opts;

  const userId = uuid();
  const passwordHash = await hashPassword(password);

  await pool.query(
    `
    INSERT INTO essen_wissen.app_users (id, email, password_hash, first_name, last_name, is_active)
    VALUES ($1, $2, $3, $4, $5, true)
    `,
    [userId, email, passwordHash, firstName, lastName],
  );

  for (const role of roles) {
    await pool.query(
      `
      INSERT INTO essen_wissen.user_roles (user_id, role_code)
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
 * @param {{ title?: string, eventType?: 'bus'|'kitchen', startsAt: string, endsAt: string }} opts
 */
export async function setupTestEvent(opts) {
  const {
    title = 'Test-Event',
    eventType = 'bus',
    startsAt,
    endsAt,
  } = opts;

  const eventId = uuid();

  await pool.query(
    `
    INSERT INTO essen_wissen.events (id, title, event_type, starts_at, ends_at, visibility)
    VALUES ($1, $2, $3, $4, $5, 'public')
    `,
    [eventId, title, eventType, startsAt, endsAt],
  );

  return { id: eventId, title, eventType, startsAt, endsAt };
}