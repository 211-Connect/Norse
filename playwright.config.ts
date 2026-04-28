import { defineConfig, devices } from '@playwright/test';

import { DEFAULT_ACTION_TIMEOUT_MS, TEST_TIMEOUT_MS } from './e2e/timeouts';

export const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/**
 * Playwright E2E test configuration for Norse.
 *
 * By default tests run against http://localhost:3000.
 * Override with environment variable:
 *
 *   E2E_BASE_URL=https://staging.example.com
 *
 * For authenticated tests (Favorites), provide:
 *   TEST_USER_EMAIL=...
 *   TEST_USER_PASSWORD=...
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: {
    /** @see e2e/timeouts `DEFAULT_ACTION_TIMEOUT_MS` / `E2E_DEFAULT_ACTION_TIMEOUT_MS` */
    timeout: DEFAULT_ACTION_TIMEOUT_MS,
  },
  /**
   * Per-test ceiling only. Each expect/goto uses `e2e/timeouts` (e.g. 20s
   * `SEARCH_NAV_TIMEOUT_MS` per URL wait) so failures name the action; this
   * value must be large enough for long flows. @see E2E_TEST_TIMEOUT_MS
   */
  timeout: TEST_TIMEOUT_MS,

  use: {
    baseURL,
    /**
     * Per locator action (click, fill, …). @see e2e/timeouts
     * `DEFAULT_ACTION_TIMEOUT_MS` — must match `expect.timeout` for consistency.
     */
    actionTimeout: DEFAULT_ACTION_TIMEOUT_MS,
    launchOptions: {
      slowMo: Number(process.env.PW_SLOWMO ?? 0),
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en',
  },

  projects: [
    {
      name: 'search-taxonomy',
      testMatch: ['**/search-taxonomy.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'translations',
      testMatch: ['**/translations.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'favorites',
      testMatch: ['**/favorites.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
      workers: 1,
    },
    {
      name: 'accessibility',
      testMatch: ['**/a11y/*.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
  ],
});
