import { type Page, expect } from '@playwright/test';

import { baseURL } from '../../playwright.config';
import {
  AUTH_NAV_TIMEOUT_MS,
  PAGE_LOAD_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from '../timeouts';

export const LOCALE = 'en';

/**
 * Wait for the page to fully stabilize after navigation or state changes.
 * Waits for network idle and ensures the toploader is hidden.
 */
export async function waitForPageStabilized(page: Page) {
  await page.waitForLoadState('networkidle', {
    timeout: SEARCH_NAV_TIMEOUT_MS,
  });
  await page
    .getByTestId('toploader-bar')
    .waitFor({ state: 'hidden', timeout: UI_SHELL_TIMEOUT_MS })
    .catch(() => null);
}

export async function goHome(page: Page) {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL(LOCALE, base).href;
  // Wait for the full document 'load' event (not just DOMContentLoaded) so
  // the app's React bundles have a chance to load and hydrate before we start
  // clicking. Dev environments with heavy third-party scripts still complete
  // 'load'; they just never reach 'networkidle'.
  await page.goto(url, {
    timeout: PAGE_LOAD_TIMEOUT_MS,
    waitUntil: 'load',
  });
  // Hydration/translation timing can be slower on dev deployments, so assert
  // on the global header shell instead of a blanket networkidle.
  await page.getByTestId('favorites-btn').waitFor({
    state: 'visible',
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

export async function expectAuthenticatedShell(page: Page) {
  await goHome(page);

  const favoritesButton = page.getByTestId('favorites-btn');
  await expect(favoritesButton).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

  await expect(page.getByRole('button', { name: /log out/i })).toBeVisible({
    timeout: AUTH_NAV_TIMEOUT_MS,
  });
}
