import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { getLandingPagesVersion } from '@/payload/services/landingPages';

/** GET ?tenantId= → the version of the tenant's landing pages. */
export const GET = internalRoute(async (request) => {
  const tenantId = requireParam(request, 'tenantId');
  if (tenantId instanceof Response) return tenantId;

  return getLandingPagesVersion(tenantId);
});
