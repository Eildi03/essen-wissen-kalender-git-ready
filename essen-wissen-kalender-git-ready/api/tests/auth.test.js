import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createToken, verifyToken } from '../../src/auth.js';

describe('auth helpers', () => {
  it('hashPassword erzeugt gültigen scrypt-Hash', async () => {
    const hash = await hashPassword('geheim');
    expect(hash).toMatch(/^scrypt\$/);
    const parts = hash.split('$');
    expect(parts).toHaveLength(3);
  });

  it('verifyPassword unterscheidet korrekt zwischen richtig und falsch', async () => {
    const hash = await hashPassword('geheim');
    expect(await verifyPassword('geheim', hash)).toBe(true);
    expect(await verifyPassword('falsch', hash)).toBe(false);
  });

  it('createToken & verifyToken arbeiten zusammen', () => {
    const token = createToken({ sub: 'user-1', email: 'test@example.org', roles: ['planner'] });
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('test@example.org');
    expect(payload.roles).toContain('planner');
  });
});