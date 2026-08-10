import type { Page } from '@playwright/test';

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
  const identity = process.env.TEST_USER_EMAIL || 'test@c211.io';
  const password = process.env.TEST_USER_PASSWORD || 'test-password';

  await goHome(page);

  const logoutButton = page.getByRole('button', { name: /log out/i });
  if (await isVisible(logoutButton)) {
    return;
  }

  const headerSignInButton = page.getByTestId('header-sign-in-btn');
  if (await isVisible(headerSignInButton)) {
    await headerSignInButton.click();
  } else {
    await page.getByTestId('favorites-btn').click();
    await page.getByTestId('login-btn').click();
  }

  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: AUTH_NAV_TIMEOUT_MS })
    .catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: AUTH_NAV_TIMEOUT_MS });

  const url = page.url();
  if (isAuthHost(url)) {
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
    await page.waitForLoadState('networkidle', {
      timeout: AUTH_NAV_TIMEOUT_MS,
    });
  }

  await expectAuthenticatedShell(page);
}
