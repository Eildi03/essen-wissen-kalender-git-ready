import { describe, it, expect } from 'vitest';
import { visibleEvents } from '../../public/app.js';

describe('visibleEvents filtert anhand state', () => {
  it('filtert nach Typ und Status', () => {
    const state = {
      events: [
        { id: 1, type: 'bus', status: 'bestätigt', title: 'A', state: 'Berlin', visibility: 'öffentlich', city: 'Berlin', institution: 'GS' },
        { id: 2, type: 'kitchen', status: 'Anfrage', title: 'B', state: 'Brandenburg', visibility: 'intern', city: 'Potsdam', institution: 'Kita' }
      ],
      type: 'bus',
      status: 'all',
      region: 'all',
      search: '',
      mode: 'internal'
    };
    const result = visibleEvents(state);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bus');
  });
});