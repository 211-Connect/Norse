import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { listLandingSitemap } from '@/payload/services/landingPages';

/** GET ?tenantId= → every live landing page with its paths per locale. */
export const GET = internalRoute(async (request) => {
  const tenantId = requireParam(request, 'tenantId');
  if (tenantId instanceof Response) return tenantId;

  return listLandingSitemap(tenantId);
});
