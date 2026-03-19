import { defineConfig, devices } from '@playwright/test';

const defaultBaseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const translationsBaseUrl =
  process.env.E2E_TRANSLATIONS_BASE_URL || defaultBaseUrl;

/**
 * Playwright E2E test configuration for Norse.
 *
 * By default tests run against http://localhost:3000.
 * Override with environment variables:
 *
 *   E2E_BASE_URL=https://staging.example.com
 *   E2E_TRANSLATIONS_BASE_URL=https://preview.example.com
 *
 * `E2E_BASE_URL` remains a global fallback for all projects.
 * `E2E_TRANSLATIONS_BASE_URL` is used by translations.
 *
 * For authenticated tests (Favorites), provide:
 *   TEST_USER_EMAIL=... (or TEST_USER_USERNAME=...)
 *   TEST_USER_PASSWORD=...
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,

  use: {
    baseURL: defaultBaseUrl,
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
      use: { ...devices['Desktop Chrome'], baseURL: defaultBaseUrl },
    },
    {
      name: 'translations',
      testMatch: ['**/translations.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL: translationsBaseUrl },
    },
    {
      name: 'favorites',
      testMatch: ['**/favorites.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL: defaultBaseUrl },
      workers: 1,
    },
  ],
});
