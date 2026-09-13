import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { resetDatabase, setupTestEvent } from '../utils/db-test-helpers.js';

describe('GET /public/events', () => {
  beforeAll(async () => {
    await resetDatabase();
    const startsAt = new Date(Date.now() + 7 * 86400000);
    const endsAt = new Date(startsAt.getTime() + 4 * 3600000);
    await setupTestEvent({
      title: 'Öffentlicher Bus-Einsatz',
      eventType: 'bus',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  });

  it('liefert öffentliche Events', async () => {
    const res = await request(app).get('/api/v1/public/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((e) => e.title === 'Öffentlicher Bus-Einsatz')).toBe(true);
  });
});