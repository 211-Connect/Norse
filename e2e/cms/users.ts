/**
 * The Payload CMS test accounts for the `cms` project. They exist on the dev
 * CMS only (see `cmsBaseUrl` in `e2e/fixtures/tenants.ts`); emails are
 * derived from the current tenant and environment, and both share the
 * `TEST_CMS_PASSWORD` secret.
 */
import {
  getCmsBaseUrlForCurrentTenant,
  getCmsTestEmailsForCurrentTenant,
  getCurrentTenantKey,
} from '../fixtures/tenants';

export type CmsE2EUser = {
  /** Shown in test titles. */
  label: string;
  email: string;
  password: string;
};

const password = process.env.TEST_CMS_PASSWORD ?? '';

/**
 * Why the CMS tests cannot run here, or `undefined` when they can. They need
 * the current tenant's dev CMS (never production) and the shared password.
 */
export const cmsSkipReason: string | undefined =
  !getCmsBaseUrlForCurrentTenant()
    ? `No dev CMS for ${getCurrentTenantKey()} here (cmsBaseUrl); CMS tests run on dev only.`
    : !password
      ? 'TEST_CMS_PASSWORD is not set.'
      : undefined;

const emails = getCmsTestEmailsForCurrentTenant();

/** A super-admin: sees every tenant. */
export const CMS_SUPER_ADMIN: CmsE2EUser = {
  label: 'super-admin',
  email: emails.superAdmin,
  password,
};

/** A tenant-admin on the current tenant only (the bug-prone path). */
export const CMS_TENANT_ADMIN: CmsE2EUser = {
  label: 'tenant-admin',
  email: emails.tenantAdmin,
  password,
};
