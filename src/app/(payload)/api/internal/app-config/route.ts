import { TypedLocale } from 'payload';

import { getAppConfigForHost } from '@/app/(app)/shared/utils/appConfig';
import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { locales } from '@/payload/i18n/locales';

/**
 * GET ?host=&locale= → the tenant's built app config without its
 * per-request fields (`baseUrl`, `sessionId`). Cached in memory and Redis.
 */
export const GET = internalRoute(async (request) => {
  const host = requireParam(request, 'host');
  if (host instanceof Response) return host;
  const locale = requireParam(request, 'locale');
  if (locale instanceof Response) return locale;
  if (!locales.includes(locale as TypedLocale)) {
    return Response.json({ error: 'Invalid locale' }, { status: 400 });
  }

  return getAppConfigForHost(host, locale);
});
