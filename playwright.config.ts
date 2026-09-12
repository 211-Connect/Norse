import { defineConfig, devices } from '@playwright/test';

import { getBaseUrlForCurrentTenant } from './e2e/fixtures/tenants';
import { DEFAULT_ACTION_TIMEOUT_MS, TEST_TIMEOUT_MS } from './e2e/timeouts';

function resolveBaseURL(): string {
  if (process.env.E2E_BASE_URL) {
    return process.env.E2E_BASE_URL;
  }
  // When a tenant/env is explicitly selected, derive the base URL from the
  // fixture. Otherwise keep the historical localhost default for bare runs.
  if (process.env.E2E_TENANT_KEY || process.env.E2E_TENANT_ENV) {
    return getBaseUrlForCurrentTenant();
  }
  return 'http://localhost:3000';
}

export const baseURL = resolveBaseURL();

/**
 * Playwright E2E test configuration for Norse.
 *
 * By default tests run against http://localhost:3000.
 * Override with environment variable:
 *
 *   E2E_BASE_URL=https://staging.example.com
 *
 * Or select a tenant/environment and the base URL is derived from
 * e2e/fixtures/tenants.ts:
 *
 *   E2E_TENANT_KEY=WA E2E_TENANT_ENV=dev
 *
 * For authenticated tests (Favorites), provide:
 *   TEST_USER_EMAIL=...
 *   TEST_USER_PASSWORD=...
 *
 * TEST_USER_EMAIL can be omitted when E2E_TENANT_KEY/E2E_TENANT_ENV are set;
 * it is derived as test-<tenant>-<env>@c211.io from the fixture.
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
      testMatch: [
        '**/search-taxonomy.spec.ts',
        '**/search-suggestions.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'translations',
      testMatch: ['**/translations.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'search-geocode',
      testMatch: ['**/search-location-geocode.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'favorites',
      testMatch: ['**/favorites.spec.ts', '**/local-favorites.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
      workers: 1,
    },
    {
      name: 'share-link',
      testMatch: ['**/share-link.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'accessibility',
      testMatch: ['**/search-accessibility.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'ai-classification',
      testMatch: ['**/search-ai-classification.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'resource-direct-link',
      testMatch: ['**/search-resource-direct-link.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'organization',
      testMatch: [
        '**/search-organization.spec.ts',
        '**/search-organization-direct-link.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'], baseURL },
    },
  ],
});
