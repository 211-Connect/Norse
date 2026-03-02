/**
 * Playwright global setup: authenticate via Keycloak and persist session.
 *
 * This file runs as a project dependency so that all tests requiring
 * authentication share the same logged-in browser state.
 *
 * Required env vars:
 *   TEST_USER_EMAIL or TEST_USER_USERNAME – Keycloak test user identity
 *   TEST_USER_PASSWORD – Keycloak test user password
 *
 * When credentials are not provided the auth setup is skipped and
 * favorites tests will be skipped at runtime.
 */
import { chromium, type FullConfig } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { goHome } from './helpers';

const AUTH_DIR = path.join(process.cwd(), 'e2e', '.auth');
const AUTH_STATE = path.join(AUTH_DIR, 'user.json');

async function hasValidStoredSession(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseURL: string,
) {
  if (!fs.existsSync(AUTH_STATE)) {
    return false;
  }

  const context = await browser.newContext({
    baseURL,
    storageState: AUTH_STATE,
  });
  const page = await context.newPage();

  try {
    await page.goto('/en/favorites');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const url = page.url();
    const redirectedToAuth =
      url.includes('/auth/signin') ||
      url.includes('auth.c211.io') ||
      url.includes('keycloak');

    if (redirectedToAuth) {
      return false;
    }

    const createListButton = page.getByRole('button', {
      name: /create a list/i,
    });
    return await createListButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

async function globalSetup(config: FullConfig) {
  const identity =
    process.env.TEST_USER_EMAIL ?? process.env.TEST_USER_USERNAME;
  const password = process.env.TEST_USER_PASSWORD;

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';
  const browser = await chromium.launch();

  const sessionStillValid = await hasValidStoredSession(
    browser,
    String(baseURL),
  );
  if (sessionStillValid) {
    console.log('Using existing authenticated Playwright storage state.');
    await browser.close();
    return;
  }

  if (!identity || !password) {
    console.warn(
      '\n⚠  No valid stored auth state and TEST_USER_EMAIL/TEST_USER_USERNAME + TEST_USER_PASSWORD are missing.\n' +
        '   Set credentials once to generate e2e/.auth/user.json.\n',
    );
    await browser.close();
    return;
  }

  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await goHome(page);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /my stuff/i }).click();
  await page.getByRole('button', { name: /favorites/i }).click();
  console.log(
    'Navigated to favorites, waiting for potential redirect to Keycloak...',
  );
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: 60000 })
    .catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 60000 });

  // If we were redirected to Keycloak, fill the login form
  const url = page.url();
  if (url.includes('auth.c211.io') || url.includes('keycloak')) {
    const identityInput = page
      .locator('input[name="username"], #username')
      .first();
    await identityInput.waitFor({ state: 'visible', timeout: 15000 });
    await identityInput.fill(identity);

    const passwordInput = page
      .locator('input[name="password"], #password, input[type="password"]')
      .first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(password);

    await page.locator('#kc-login').click();
    await page.waitForURL('**/en/**', { timeout: 60000 }).catch(() => null);
    await page.waitForLoadState('networkidle', { timeout: 60000 });
  }

  await page.goto('/en/favorites');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  const finalUrl = page.url();
  const stillOnAuth =
    finalUrl.includes('/auth/signin') ||
    finalUrl.includes('auth.c211.io') ||
    finalUrl.includes('keycloak');

  if (stillOnAuth) {
    throw new Error(
      `Authentication failed: still redirected to auth provider (${finalUrl}).`,
    );
  }

  // Save authenticated state
  await context.storageState({ path: AUTH_STATE });

  await browser.close();
}

export default globalSetup;
