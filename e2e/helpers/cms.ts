import { type Page, expect } from '@playwright/test';

import type { CmsE2EUser } from '../cms/users';
import { PAGE_LOAD_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from '../timeouts';
import { isVisible } from './internal';
import { toSingleRegexLiteral } from './url';

/** The admin root: the Analytics dashboard. */
export const CMS_ADMIN_PATH = '/admin';

export type CmsNavLink = { label: string; path: string };

type CmsMe = {
  user: {
    id: number;
    tenants?: { tenant: string | { id: string } }[];
  } | null;
};

/**
 * Logs in through Payload's REST API. `page.request` shares the page's
 * cookie jar, so the `payload-token` (and the `payload-tenant` cookie set by
 * the Users `afterLogin` hook) apply to the page's next navigation. No IdP
 * redirect chain is involved, so logging in per test is cheap.
 */
export async function loginToCms(page: Page, user: CmsE2EUser): Promise<void> {
  const response = await page.request.post('/api/users/login', {
    data: { email: user.email, password: user.password },
  });
  expect(
    response.ok(),
    `CMS login failed for ${user.email} (HTTP ${response.status()}). ` +
      'Seed the local CMS users first: npm run test:e2e:cms:seed',
  ).toBe(true);
}

/** Tenant ids the logged-in user is assigned to (empty for super-admins). */
export async function getCmsUserTenantIds(page: Page): Promise<string[]> {
  const response = await page.request.get('/api/users/me?depth=0');
  expect(response.ok()).toBe(true);
  const { user } = (await response.json()) as CmsMe;
  return (user?.tenants ?? []).map(({ tenant }) =>
    typeof tenant === 'string' ? tenant : tenant.id,
  );
}

/**
 * Opens an admin path and waits until Payload's sidebar has hydrated
 * (`nav--nav-hydrated`); before that the "Open Menu" toggle is not rendered
 * and sidebar clicks do nothing.
 */
export async function gotoCms(page: Page, path: string): Promise<void> {
  await page.goto(path, { timeout: PAGE_LOAD_TIMEOUT_MS });
  await expect(page.locator('.nav.nav--nav-hydrated')).toBeAttached({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/** Payload's sidebar navigation. */
export function cmsSidebar(page: Page) {
  return page.locator('nav.nav__wrap');
}

/**
 * Clicks a sidebar link by its label. Below Payload's wide breakpoint the
 * sidebar starts closed (its links are inert), so it is opened first with
 * the "Open Menu" button, as a user would.
 */
export async function clickCmsNavLink(
  page: Page,
  label: string,
): Promise<void> {
  const openMenu = page.getByRole('button', { name: 'Open Menu' });
  if (await isVisible(openMenu)) {
    await openMenu.click();
  }
  await cmsSidebar(page)
    .getByRole('link', { name: label, exact: true })
    .click();
}

/**
 * Every sidebar link that opens an admin page other than the dashboard
 * itself (logout and the Analytics/dashboard link are left out).
 */
export async function getCmsNavLinks(page: Page): Promise<CmsNavLink[]> {
  const links = await cmsSidebar(page)
    .locator('a[href^="/admin/"]')
    .evaluateAll((anchors) =>
      anchors.map((a) => ({
        label: (a.textContent ?? '').trim(),
        path: a.getAttribute('href') ?? '',
      })),
    );
  return links.filter(
    ({ label, path }) => label !== '' && path !== '/admin/logout',
  );
}

/** Asserts the page has left the dashboard for `path` (or a page below it). */
export async function expectCmsPathOpened(
  page: Page,
  path: string,
): Promise<void> {
  await expect
    .poll(() => new URL(page.url()).pathname, {
      message: `${path} bounced to another page`,
      timeout: PAGE_LOAD_TIMEOUT_MS,
    })
    .toMatch(new RegExp(`^${toSingleRegexLiteral(path)}(/|$)`));
}

/**
 * Asserts a Settings (`resource-directories`) document edit view is shown,
 * for `tenantId` when given. `.collection-edit` is Payload's own edit-view
 * class (no testid exists in Payload's admin UI).
 */
export async function expectCmsSettingsDocument(
  page: Page,
  tenantId?: string,
): Promise<void> {
  const path = `${CMS_ADMIN_PATH}/collections/resource-directories/${
    tenantId ?? '[^/]+'
  }`;
  await expect(page).toHaveURL(new RegExp(`${path}$`), {
    timeout: PAGE_LOAD_TIMEOUT_MS,
  });
  await expect(page.locator('.collection-edit')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}
