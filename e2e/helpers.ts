import { test as base, expect, type Page } from '@playwright/test';

export const LOCALE = 'en';

function isAuthHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return host === 'auth.c211.io' || host.includes('keycloak');
  } catch {
    return false;
  }
}

export async function goHome(page: Page) {
  await page.goto(`/${LOCALE}`);
  await page.waitForLoadState('networkidle');
}

export async function goToSearch(page: Page) {
  await page.getByRole('link', { name: 'Search' }).click();
  await page.waitForLoadState('networkidle');
}

export async function openSearchDialog(page: Page) {
  await page
    .getByPlaceholder('Food, clothing, shelter, etc...')
    .first()
    .click();
  await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });
  return page.locator('#search-input');
}

export type SearchParams = {
  query: string;
  query_label: string;
  query_type: 'text' | 'taxonomy';
};

export async function performSearch(page: Page, params: SearchParams) {
  const searchInput = await openSearchDialog(page);

  if (params.query_type === 'taxonomy') {
    await searchInput.fill(params.query_label ?? params.query);

    const listbox = page.locator('div[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });

    const options = listbox.locator('div[role="option"]');
    const optionCount = await options.count();
    if (optionCount === 0) {
      throw new Error('No taxonomy options were returned from autocomplete');
    }

    const taxonomyPrefix = params.query.split('.')[0];
    const exactCodeOption = options.filter({ hasText: params.query });
    const prefixCodeOption = options.filter({ hasText: taxonomyPrefix });
    const taxonomyLikeOption = options.filter({ hasText: /[A-Z]{2}-\d{4}/ });

    if ((await exactCodeOption.count()) > 0) {
      await exactCodeOption.first().click();
    } else if ((await prefixCodeOption.count()) > 0) {
      await prefixCodeOption.first().click();
    } else if ((await taxonomyLikeOption.count()) > 0) {
      await taxonomyLikeOption.first().click();
    } else {
      await options.first().click();
    }
  } else {
    await searchInput.fill(params.query ?? '');
  }

  await page.locator('div[role="dialog"] button[type="submit"]').click();

  await page.waitForURL(/\/search\?/);
  await page.waitForLoadState('networkidle');
}

export async function goToFavorites(page: Page) {
  await page.getByRole('button', { name: /my stuff/i }).click();
  await page.getByRole('button', { name: /favorites/i }).click();
  await page.waitForLoadState('networkidle');
}

export async function getResultTotal(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await resultTotal.waitFor({ state: 'visible', timeout: 15000 });
  return (await resultTotal.textContent()) ?? '';
}

export function parseTotalFromResultText(text: string): number {
  const match = text.match(/of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function loginViaKeycloak(page: Page) {
  const identity =
    process.env.TEST_USER_EMAIL ||
    process.env.TEST_USER_USERNAME ||
    'test-user';
  const password = process.env.TEST_USER_PASSWORD || 'test-password';

  await goHome(page);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /my stuff/i }).click();
  await page.getByRole('button', { name: /favorites/i }).click();
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: 60_000 })
    .catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 60_000 });

  const url = page.url();
  if (isAuthHost(url)) {
    const identityInput = page
      .locator('input[name="username"], #username')
      .first();
    await identityInput.waitFor({ state: 'visible', timeout: 15_000 });
    await identityInput.fill(identity);

    const passwordInput = page
      .locator('input[name="password"], #password, input[type="password"]')
      .first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordInput.fill(password);

    await Promise.all([
      page.waitForURL((url) => !isAuthHost(url.href), { timeout: 60_000 }),
      page.locator('#kc-login').click(),
    ]);
    await page.waitForLoadState('networkidle', { timeout: 60_000 });
  }
}

export { base as test, expect };
