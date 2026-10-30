import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

/** GET ?host= → the tenant that owns `host`, or `null`. */
export const GET = internalRoute(async (request) => {
  const host = requireParam(request, 'host');
  if (host instanceof Response) return host;
  return findTenantByHost(host);
});
