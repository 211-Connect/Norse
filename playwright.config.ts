import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Norse.
 *
 * By default tests run against http://localhost:3000.
 * Override with the E2E_BASE_URL environment variable:
 *
 *   E2E_BASE_URL=https://staging.example.com npx playwright test
 *
 * For authenticated tests (Favorites), provide:
 *   TEST_USER_EMAIL=... (or TEST_USER_USERNAME=...)
 *   TEST_USER_PASSWORD=...
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    launchOptions: {
      slowMo: Number(process.env.PW_SLOWMO ?? 0),
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en',
  },

  /* Global setup for authentication/session reuse */
  globalSetup: './e2e/auth.setup.ts',

  projects: [
    {
      name: 'search-taxonomy',
      testMatch: ['**/search-taxonomy.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'favorites',
      testMatch: ['**/favorites.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      workers: 1,
    },
  ],
});
