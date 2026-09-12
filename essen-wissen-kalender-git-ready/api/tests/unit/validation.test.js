import { describe, it, expect } from 'vitest';
import { requiredString, eventInput } from '../../src/validation.js';

describe('validation helpers', () => {
  it('requiredString akzeptiert gültige Strings und lehnt leere ab', () => {
    expect(requiredString('abc')).toBe('abc');
    expect(() => requiredString('')).toThrow();
    expect(() => requiredString(null)).toThrow();
  });

  it('eventInput validiert grundlegende Felder', () => {
    const input = {
      title: 'Bus-Einsatz',
      eventType: 'bus',
      startsAt: '2026-09-02T09:00:00Z',
      endsAt: '2026-09-02T13:00:00Z'
    };
    const result = eventInput(input);
    expect(result.title).toBe('Bus-Einsatz');
    expect(result.eventType).toBe('bus');
    expect(result.startsAt).toBe('2026-09-02T09:00:00Z');
    expect(result.endsAt).toBe('2026-09-02T13:00:00Z');
  });
});