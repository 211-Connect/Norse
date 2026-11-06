import { NextRequest, NextResponse } from 'next/server';

import { parsePinsQuery } from '@/app/(app)/shared/lib/search-params';
import { findResourcePins } from '@/app/(app)/shared/services/search-pins-service';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { isValidLocale } from '@/payload/i18n/locales';

/** As long as the Redis entry behind it: pins only change on a reindex. */
const BROWSER_CACHE_SECONDS = 60 * 60;

/**
 * Every result's map pin for a search, fetched by the search map once the
 * list has rendered (see docs/map-pins.md). The tenant comes from the host,
 * never the query, so a request can only read the tenant it is sent to.
 */
export async function GET(request: NextRequest) {
  const params = parsePinsQuery(request.nextUrl.search);
  const locale = params.locale;

  if (typeof locale !== 'string' || !isValidLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const appConfig = await getAppConfigWithoutHost(locale);

  if (
    !appConfig.search.showAllResultsOnMap ||
    !appConfig.i18n.locales.includes(locale)
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pins = await findResourcePins(params, locale, appConfig.tenantId);

  if (!pins) {
    return NextResponse.json({ error: 'Pins unavailable' }, { status: 502 });
  }

  return NextResponse.json(
    { pins },
    {
      headers: {
        // Private: the response depends on the host, and pins are per tenant.
        'Cache-Control': `private, max-age=${BROWSER_CACHE_SECONDS}`,
      },
    },
  );
}
