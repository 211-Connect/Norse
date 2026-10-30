import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { findTenantByRealmId } from '@/payload/collections/Tenants/actions/findTenantByRealmId';

/** GET ?realmId= → the tenant using that Keycloak realm, or `null`. */
export const GET = internalRoute(async (request) => {
  const realmId = requireParam(request, 'realmId');
  if (realmId instanceof Response) return realmId;
  return findTenantByRealmId(realmId);
});
