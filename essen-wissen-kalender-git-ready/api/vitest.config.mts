/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,ts,mjs,cjs}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['tests/setup.js'],
    maxConcurrency: 4,
    testTimeout: 30000
  }
});