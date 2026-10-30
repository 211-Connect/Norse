import type { Tenant } from '@/payload/payload-types';
import { withCache } from '@/utilities/withCache';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/**
 * Tenant documents for the public app, credentials included: server-only.
 * Cached under the same keys as the Payload lookups, which the CMS's
 * Tenants `revalidateCache` hook deletes on save.
 *
 * Every in-process branch sits under `process.env.NORSE_BUILD !== 'app'`,
 * which Next.js inlines at build time: the public app's build drops it and
 * never bundles Payload (docs/cms-app-separation-plan.md).
 */

/** The tenant that owns `host` (a parsed hostname), or `null`. */
export async function getTenantByHost(host: string): Promise<Tenant | null> {
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { findTenantByHost } =
        await import('@/payload/collections/Tenants/actions/findTenantByHost');
      return findTenantByHost(host);
    }
  }

  return withCache(
    `tenant:${host}`,
    () => cmsRequest<Tenant | null>('tenants/by-host', { query: { host } }),
    { redis: true, memory: true },
  );
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { findTenantById } =
        await import('@/payload/collections/Tenants/actions/findTenantById');
      return findTenantById(tenantId);
    }
  }

  return withCache(`tenant:${tenantId}`, () =>
    cmsRequest<Tenant | null>('tenants/by-id', { query: { id: tenantId } }),
  );
}

/** Uncached: the Keycloak domain check must see allow-list changes at once. */
export async function getTenantByRealmId(
  realmId: string,
): Promise<Tenant | null> {
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { findTenantByRealmId } =
        await import('@/payload/collections/Tenants/actions/findTenantByRealmId');
      return findTenantByRealmId(realmId);
    }
  }

  return cmsRequest<Tenant | null>('tenants/by-realm', {
    query: { realmId },
  });
}
