// import '.env/config';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://essen_wissen_admin:admin_pw@localhost:55432/essen_wissen_test';
process.env.CORS_ORIGIN = 'http://localhost:4173';

// import { afterAll } from 'vitest';
// import { pool } from '../src/db.js';

// // Nach Tests DB-Verbindung schließen
// afterAll(async () => {
//   await pool.end();
// });