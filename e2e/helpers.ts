import { test as base, expect, type Page } from '@playwright/test';

export const LOCALE = 'en';

/** Navigate to the home page with the default locale. */
export async function goHome(page: Page) {
  await page.goto(`/${LOCALE}`);
  await page.waitForLoadState('networkidle');
}

/** Navigate to the search results page with the given query params. */
export async function goToSearch(page: Page, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  await page.goto(`/${LOCALE}/search?${qs}`);
  await page.waitForLoadState('networkidle');
}

/** Navigate to the favorites page. */
export async function goToFavorites(page: Page) {
  await page.goto(`/${LOCALE}/favorites`);
  await page.waitForLoadState('networkidle');
}

/**
 * Open the search dialog, type a query, and submit.
 * Returns after navigation to the search results page.
 */
export async function performSearch(page: Page, query: string) {
  // Click the search trigger input to open the search dialog
  await page
    .getByPlaceholder('Food, clothing, shelter, etc...')
    .first()
    .click();

  // Wait for dialog
  await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

  // Type the query into the search input
  const searchInput = page.locator('#search-input');
  await searchInput.fill(query);

  // Submit the search form
  await page.locator('div[role="dialog"] button[type="submit"]').click();

  // Wait for navigation to search results
  await page.waitForURL(/\/search\?/);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for search results to load and return the total results text.
 */
export async function getResultTotal(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await resultTotal.waitFor({ state: 'visible', timeout: 15000 });
  return (await resultTotal.textContent()) ?? '';
}

/**
 * Parse the total number of results from the result-total text.
 * Format: "1-10 of 42"
 */
export function parseTotalFromResultText(text: string): number {
  const match = text.match(/of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Storage state file path for an authenticated session.
 * Tests requiring auth should use this via `test.use({ storageState })`.
 */
export const AUTH_STATE_PATH = 'e2e/.auth/user.json';

export { base as test, expect };
