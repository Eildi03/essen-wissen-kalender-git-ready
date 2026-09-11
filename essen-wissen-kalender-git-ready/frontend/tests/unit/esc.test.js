import { describe, it, expect } from 'vitest';
import { esc } from '../../public/app.js'; // ggf. export ergänzen

describe('esc helper', () => {
  it('escaped gefährliche Zeichen korrekt', () => {
    const input = `<script>alert('x')</script>`;
    const out = esc(input);
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });
});