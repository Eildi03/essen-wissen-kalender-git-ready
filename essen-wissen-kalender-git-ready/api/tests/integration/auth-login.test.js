import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { setupTestUser } from '../utils/db-test-helpers.js';



describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await setupTestUser({
      email: 'test@example.org',
      password: 'geheim',
      roles: ['planner']
    });
  });

  it('liefert Token und User bei korrektem Login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.org', password: 'geheim' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.org');
  });

  it('liefert 401 bei falschem Passwort', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.org', password: 'falsch' });

    expect(res.status).toBe(401);
  });
});