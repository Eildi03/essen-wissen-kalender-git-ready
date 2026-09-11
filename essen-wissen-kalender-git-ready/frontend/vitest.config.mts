/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,ts,mjs,cjs}'],
    setupFiles: ['tests/setup.js'],
    coverage: {
      enabled: true,
      reporter: ['text', 'lcov'],
      include: ['public/app.js']
    }
  }
});
