/**
 * Payload CMS admin navigation, per role. Guards the regression where a
 * tenant-admin or tenant-editor clicking "Settings" was sent back to the
 * Analytics dashboard: `@payloadcms/plugin-multi-tenant` 3.93's
 * `GlobalViewRedirect` read its tenant field names under the wrong prop names,
 * found no tenants for a user without access to all of them, and redirected
 * to the admin root. Fixed upstream in 3.94.0.
 *
 * Local only: needs the users from `npm run test:e2e:cms:seed`.
 */
import {
  CMS_ADMIN_PATH,
  clickCmsNavLink,
  expect,
  expectCmsPathOpened,
  expectCmsSettingsDocument,
  getCmsNavLinks,
  getCmsUserTenantIds,
  gotoCms,
  loginToCms,
  test,
} from '../helpers';
import { CMS_E2E_USERS, CMS_TENANT_USERS } from './users';

const SETTINGS_LIST_PATH = `${CMS_ADMIN_PATH}/collections/resource-directories`;

for (const user of CMS_TENANT_USERS) {
  test.describe(`CMS as ${user.tenantRole}`, () => {
    let tenantId: string;

    test.beforeEach(async ({ page }) => {
      await loginToCms(page, user);
      const tenantIds = await getCmsUserTenantIds(page);
      expect(tenantIds, `${user.email} has one tenant`).toHaveLength(1);
      tenantId = tenantIds[0];
    });

    test('Settings in the sidebar opens the tenant Settings', async ({
      page,
    }) => {
      await gotoCms(page, CMS_ADMIN_PATH);
      await clickCmsNavLink(page, 'Settings');
      await expectCmsSettingsDocument(page, tenantId);
    });

    test('the Settings list redirects to the tenant Settings', async ({
      page,
    }) => {
      await gotoCms(page, SETTINGS_LIST_PATH);
      await expectCmsSettingsDocument(page, tenantId);
    });

    test('a link to the tenant Settings opens it', async ({ page }) => {
      await gotoCms(page, `${SETTINGS_LIST_PATH}/${tenantId}`);
      await expectCmsSettingsDocument(page, tenantId);
    });

    test('every sidebar link opens its own page', async ({ page }) => {
      await gotoCms(page, CMS_ADMIN_PATH);
      const links = await getCmsNavLinks(page);
      expect(links.map(({ label }) => label)).toContain('Settings');

      for (const { label, path } of links) {
        await test.step(`${label} (${path})`, async () => {
          await gotoCms(page, path);
          await expectCmsPathOpened(page, path);
        });
      }
    });
  });
}

test.describe('CMS as super-admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginToCms(page, CMS_E2E_USERS['super-admin']);
  });

  test('Settings in the sidebar opens a tenant Settings', async ({ page }) => {
    await gotoCms(page, CMS_ADMIN_PATH);
    await clickCmsNavLink(page, 'Settings');
    await expectCmsSettingsDocument(page);
  });

  test('every sidebar link opens its own page', async ({ page }) => {
    await gotoCms(page, CMS_ADMIN_PATH);
    const links = await getCmsNavLinks(page);

    for (const { label, path } of links) {
      await test.step(`${label} (${path})`, async () => {
        await gotoCms(page, path);
        await expectCmsPathOpened(page, path);
      });
    }
  });
});
