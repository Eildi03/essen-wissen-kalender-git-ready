// tests/setup.js
import { afterAll } from 'vitest';
import dotenv from 'dotenv';


dotenv.config();

// Basis-ENV für Tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// WICHTIG: JWT_SECRET setzen
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret';
}

// WICHTIG: DATABASE_URL setzen
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgres://essen_wissen_admin:admin_pw@localhost:5432/essen_wissen_test';
}

// DB-Verbindung nach allen Tests schließen
afterAll(async () => {
 // await pool.end();
});