import { describe, it, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { resetDatabase, setupTestUser, setupTestEvent } from '../utils/db-test-helpers.js';

describe('GET /public/events', () => {
  beforeAll(async () => {
    await resetDatabase();
    await setupTestEvent({
      title: 'Öffentlicher Bus-Einsatz',
      eventType: 'bus',
      startsAt: '2026-09-02T09:00:00Z',
      endsAt: '2026-09-02T13:00:00Z',
    });
  });

  it('liefert öffentliche Events', async () => {
    const res = await request(app).get('/api/v1/public/events');
    // Assertions ...
  });
});