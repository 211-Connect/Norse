/**
 * Server-only: returns the full tenant document, credentials included. Not
 * a `'use server'` module on purpose: anything exported from one of those
 * becomes a publicly callable action. Client components use
 * `findTenantNameById` instead.
 */
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { Tenant } from '@/payload/payload-types';
import { withCache } from '@/utilities/withCache';

async function findTenantByIdOrig(tenantId: string): Promise<Tenant | null> {
  const payload = await getPayloadSingleton();
  const {
    docs: [tenant],
  } = await payload.find({
    collection: 'tenants',
    where: { id: { equals: tenantId } },
    limit: 1,
    pagination: false,
  });

  return tenant || null;
}

export async function findTenantById(
  tenantId: string,
  useCache = true,
): Promise<Tenant | null> {
  if (useCache) {
    return withCache(`tenant:${tenantId}`, () => findTenantByIdOrig(tenantId));
  }

  return findTenantByIdOrig(tenantId);
}
