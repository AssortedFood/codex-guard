// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.{test,spec}.js'],

    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
