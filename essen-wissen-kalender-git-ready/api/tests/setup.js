// tests/setup.js
import dotenv from 'dotenv';
import { afterAll } from 'vitest';
import { pool } from '../src/db.js';

// ENV aus .env laden (falls vorhanden)
dotenv.config();

// Basis-ENV für Tests setzen
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||'postgres://essen_wissen_admin:admin_pw@localhost:5432/essen_wissen_test';

// DB-Verbindung nach allen Tests schließen
afterAll(async () => {
  await pool.end();
});