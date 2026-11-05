/**
 * Server-only: the tenant whose Keycloak realm is `realmId`, credentials
 * included. Not cached: the Keycloak domain check is rare and must see
 * allow-list changes at once.
 */
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { Tenant } from '@/payload/payload-types';

export async function findTenantByRealmId(
  realmId: string,
): Promise<Tenant | null> {
  const payload = await getPayloadSingleton();
  const {
    docs: [tenant],
  } = await payload.find({
    collection: 'tenants',
    where: { 'auth.realmId': { equals: realmId } },
    limit: 1,
    pagination: false,
  });

  return tenant || null;
}
