import {
  findTenantByHost,
  findTenantById,
} from '@/payload/collections/Tenants/actions';
import { findTenantByRealmId } from '@/payload/collections/Tenants/actions/findTenantByRealmId';
import type { Tenant } from '@/payload/payload-types';
import { withCache } from '@/utilities/withCache';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/**
 * Tenant documents for the public app, credentials included: server-only.
 * Cached under the same keys as the Payload lookups, which the CMS's
 * Tenants `revalidateCache` hook deletes on save.
 */

/** The tenant that owns `host` (a parsed hostname), or `null`. */
export async function getTenantByHost(host: string): Promise<Tenant | null> {
  if (!isCmsRemote()) return findTenantByHost(host);

  return withCache(
    `tenant:${host}`,
    () => cmsRequest<Tenant | null>('tenants/by-host', { query: { host } }),
    { redis: true, memory: true },
  );
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  if (!isCmsRemote()) return findTenantById(tenantId);

  return withCache(`tenant:${tenantId}`, () =>
    cmsRequest<Tenant | null>('tenants/by-id', { query: { id: tenantId } }),
  );
}

/** Uncached: the Keycloak domain check must see allow-list changes at once. */
export async function getTenantByRealmId(
  realmId: string,
): Promise<Tenant | null> {
  if (!isCmsRemote()) return findTenantByRealmId(realmId);

  return cmsRequest<Tenant | null>('tenants/by-realm', {
    query: { realmId },
  });
}
