import process from 'node:process';
import fs from 'node:fs';
function secret(name) {
  const file = process.env[`${name}_FILE`];
  if (file) return fs.readFileSync(file, 'utf8').trim();
  const value = process.env[name];
  if (!value) throw new Error(`Secret ${name} fehlt.`);
  return value;
}
// function required(name) {
//   const value = process.env[name];
//   if (!value) {
//     if (process.env.NODE_ENV === 'test' && name === 'DATABASE_URL') {
//       // Test-Fallback
//       return 'postgres://essen_wissen_admin:admin_pw@localhost:5432/essen_wissen_test';
//     }
//     throw new Error(`Umgebungsvariable ${name} fehlt.`);
//   }
//   return value;
// }
//   export const config = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: Number(process.env.PORT || 3000),
//   databaseUrl: required('DATABASE_URL'),
//   pgSsl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
//   corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
//   trustProxy: process.env.TRUST_PROXY === 'true',
//   jwtSecret: required('JWT_SECRET'),
//   jwtTtl: process.env.JWT_TTL || '8h',
//   poolMax: Number(process.env.PG_POOL_MAX || 10),
// };


// src/config.js

function required(name) {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      if (name === 'JWT_SECRET') {
        return 'test-secret';
      }
      if (name === 'DATABASE_URL') {
        return 'postgres://essen_wissen_admin:admin_pw@localhost:5432/essen_wissen_test';
      }
    }
    throw new Error(`Umgebungsvariable ${name} fehlt.`);
  }
  return value;
}

export function loadConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: required('DATABASE_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtTtl: process.env.JWT_TTL || '15m',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4173',
    trustProxy: process.env.TRUST_PROXY === 'true',
    pgPoolMax: Number(process.env.PG_POOL_MAX || '10'),
    // ggf. weitere Felder aus deiner bisherigen config
  };
}

// Standard-Konfiguration fürs eigentliche App-Laufzeitverhalten
export const config = loadConfig();


if (config.jwtSecret.length < 32 && config.nodeEnv === 'production') throw new Error('JWT_SECRET muss in Produktion mindestens 32 Zeichen lang sein.');

