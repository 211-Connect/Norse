import { type Page, expect } from '@playwright/test';

import { getTestEmailForCurrentTenant } from '../fixtures/tenants';
import { AUTH_NAV_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from '../timeouts';
import { isVisible } from './internal';
import { expectAuthenticatedShell, goHome } from './navigation';

function isAuthHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return host === 'auth.c211.io' || host.includes('keycloak');
  } catch {
    return false;
  }
}

export async function loginViaKeycloak(page: Page) {
  await goHome(page);

  const logoutButton = page.getByRole('button', { name: /log out/i });
  const headerSignInButton = page.getByTestId('header-sign-in-btn');

  // The header can render in a loading state after goto. Wait for one of the
  // auth-specific states instead of relying on an immediate isVisible probe,
  // which can race with hydration.
  await expect(headerSignInButton.or(logoutButton)).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  if (await isVisible(logoutButton)) {
    return;
  }

  await headerSignInButton.click();

  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: AUTH_NAV_TIMEOUT_MS })
    .catch(() => null);
  await page.waitForLoadState('domcontentloaded', {
    timeout: AUTH_NAV_TIMEOUT_MS,
  });

  if (isAuthHost(page.url())) {
    await submitKeycloakCredentials(page);
  }

  await expectAuthenticatedShell(page);
}

/** Asserts the browser is on the Keycloak sign-in form (not auto-signed-in). */
export async function expectKeycloakSignInForm(page: Page) {
  await expect
    .poll(() => isAuthHost(page.url()), { timeout: AUTH_NAV_TIMEOUT_MS })
    .toBe(true);
  await expect(
    page.locator('input[name="username"], #username').first(),
  ).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
}

/**
 * On the Keycloak sign-in form: fills the test account's credentials, submits
 * and waits for the redirect back to the app. Does not navigate afterwards, so
 * callers can assert on the page the app lands on (e.g. a post-login toast).
 */
export async function submitKeycloakCredentials(page: Page) {
  const identity =
    process.env.TEST_USER_EMAIL || getTestEmailForCurrentTenant();
  const password = process.env.TEST_USER_PASSWORD || 'test-password';

  const identityInput = page
    .locator('input[name="username"], #username')
    .first();
  await identityInput.waitFor({
    state: 'visible',
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await identityInput.fill(identity);

  const passwordInput = page
    .locator('input[name="password"], #password, input[type="password"]')
    .first();
  await passwordInput.waitFor({
    state: 'visible',
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await passwordInput.fill(password);

  await Promise.all([
    page.waitForURL((url) => !isAuthHost(url.href), {
      timeout: AUTH_NAV_TIMEOUT_MS,
      waitUntil: 'domcontentloaded',
    }),
    page.locator('#kc-login').click(),
  ]);
}
