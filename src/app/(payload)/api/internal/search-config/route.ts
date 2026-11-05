import { TypedLocale } from 'payload';

import { buildSearchConfig } from '@/app/(app)/shared/utils/buildSearchConfig';
import { internalRoute, requireParam } from '@/lib/cms/internal-route';
import { locales } from '@/payload/i18n/locales';

/** GET ?tenantId=&locale= → the widget's search settings, or `null`. */
export const GET = internalRoute(async (request) => {
  const tenantId = requireParam(request, 'tenantId');
  if (tenantId instanceof Response) return tenantId;
  const locale = requireParam(request, 'locale');
  if (locale instanceof Response) return locale;
  if (!locales.includes(locale as TypedLocale)) {
    return Response.json({ error: 'Invalid locale' }, { status: 400 });
  }

  return buildSearchConfig(tenantId, locale as TypedLocale);
});
