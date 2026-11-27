import { TypedLocale } from 'payload';

import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { locales } from '@/payload/i18n/locales';
import { resolveLandingPage } from '@/payload/services/landingPages';

/** GET ?tenantId=&locale=&path= → what the landing-page path answers. */
export const GET = internalRoute(async (request) => {
  const tenantId = requireParam(request, 'tenantId');
  if (tenantId instanceof Response) return tenantId;
  const locale = requireParam(request, 'locale');
  if (locale instanceof Response) return locale;
  if (!locales.includes(locale as TypedLocale)) {
    return Response.json({ error: 'Invalid locale' }, { status: 400 });
  }
  const path = requireParam(request, 'path');
  if (path instanceof Response) return path;

  return resolveLandingPage(tenantId, locale, path);
});
