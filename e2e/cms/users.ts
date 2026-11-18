/**
 * Local-only Payload CMS e2e users. `e2e/cms/seed-cms-users.ts` creates them
 * in a local database; they never exist in a shared environment, so the
 * default password is not a secret. Override any of them with
 * `E2E_CMS_<KEY>_EMAIL` / `E2E_CMS_<KEY>_PASSWORD` (e.g.
 * `E2E_CMS_TENANT_ADMIN_EMAIL`).
 */
export type CmsUserKey = 'super-admin' | 'tenant-admin' | 'tenant-editor';

export type CmsE2EUser = {
  key: CmsUserKey;
  email: string;
  password: string;
  /** Global role on the user (`users.roles`). */
  role: 'super-admin' | 'tenant';
  /** Role on the user's one tenant (`users.tenants[].roles`), if any. */
  tenantRole?: 'tenant-admin' | 'tenant-editor';
};

const DEFAULT_PASSWORD = 'e2e-cms-local-only';

function envName(key: CmsUserKey, field: 'EMAIL' | 'PASSWORD'): string {
  return `E2E_CMS_${key.toUpperCase().replace(/-/g, '_')}_${field}`;
}

function cmsUser(
  key: CmsUserKey,
  role: CmsE2EUser['role'],
  tenantRole?: CmsE2EUser['tenantRole'],
): CmsE2EUser {
  return {
    key,
    email: process.env[envName(key, 'EMAIL')] ?? `e2e-${key}@norse.test`,
    password: process.env[envName(key, 'PASSWORD')] ?? DEFAULT_PASSWORD,
    role,
    tenantRole,
  };
}

export const CMS_E2E_USERS: Record<CmsUserKey, CmsE2EUser> = {
  'super-admin': cmsUser('super-admin', 'super-admin'),
  'tenant-admin': cmsUser('tenant-admin', 'tenant', 'tenant-admin'),
  'tenant-editor': cmsUser('tenant-editor', 'tenant', 'tenant-editor'),
};

/** The users who only see their own tenant (the bug-prone path). */
export const CMS_TENANT_USERS = [
  CMS_E2E_USERS['tenant-admin'],
  CMS_E2E_USERS['tenant-editor'],
];
