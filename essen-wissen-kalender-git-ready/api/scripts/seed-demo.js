import { hashPassword } from '../src/auth.js';
import { closePool, withTransaction } from '../src/db.js';
const email = process.env.DEMO_ADMIN_EMAIL || 'admin@example.org';
const password = process.env.DEMO_ADMIN_PASSWORD;
if (!password) throw new Error('DEMO_ADMIN_PASSWORD muss fuer die Ersteinrichtung gesetzt werden.');
const hash = await hashPassword(password);
await withTransaction(async client => {
  const result = await client.query(`INSERT INTO essen_wissen.app_users (email, password_hash, first_name, last_name) VALUES ($1, $2, 'Demo', 'Administrator') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true RETURNING id`, [email, hash]);
  await client.query(`INSERT INTO essen_wissen.user_roles (user_id, role_code) VALUES ($1, 'administrator') ON CONFLICT DO NOTHING`, [result.rows[0].id]);
}, { requestId: 'demo-seed' });
console.log(`Demo-Administrator angelegt oder aktualisiert: ${email}`);
await closePool();
