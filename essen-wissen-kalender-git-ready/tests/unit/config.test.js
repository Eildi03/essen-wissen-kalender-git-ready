import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config.js';

describe('config loader', () => {
  it('wirft Fehler, wenn JWT_SECRET fehlt', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => loadConfig()).toThrow();
    process.env.JWT_SECRET = original;
  });

  it('lädt Konfiguration korrekt, wenn alle Variablen vorhanden sind', () => {
    process.env.JWT_SECRET = 'super-secret';
    process.env.DATABASE_URL = 'postgres://user:pw@localhost/db';
    const config = loadConfig();
    expect(config.jwtSecret).toBe('super-secret');
    expect(config.databaseUrl).toMatch(/postgres:\/\/user:pw/);
  });
});