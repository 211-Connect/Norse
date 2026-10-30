import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { findTenantById } from '@/payload/collections/Tenants/actions';

/** GET ?id= → the tenant, or `null`. */
export const GET = internalRoute(async (request) => {
  const id = requireParam(request, 'id');
  if (id instanceof Response) return id;
  return findTenantById(id);
});
