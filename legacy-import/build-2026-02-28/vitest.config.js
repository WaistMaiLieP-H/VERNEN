/**
 * VERNEN™ Vitest Configuration
 * Run: npx vitest run
 * Watch: npx vitest
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    timeout: 15000,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'gdn_navigator/**',
        'validation_engine/**',
        'audit/**',
        'traceability/**',
        'remediation/**',
        'assembly/**',
        'filesign/**',
        'auth/**',
        'payments/**',
        'i18n/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '.',
    },
  },
});
