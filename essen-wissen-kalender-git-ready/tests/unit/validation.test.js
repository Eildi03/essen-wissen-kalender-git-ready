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
      type: 'bus',
      start: '2026-09-02',
      end: '2026-09-02',
      startTime: '09:00',
      endTime: '13:00'
    };
    const result = eventInput(input);
    expect(result.title).toBe('Bus-Einsatz');
    expect(result.type).toBe('bus');
  });
});