import { NextRequest, NextResponse } from 'next/server';

import { resolveV2HostTenant } from '@/app/(app)/features/search/v2/v2-host-tenant';
import type { AreaSettingsSource } from '@/app/(app)/features/search/utils/area-settings';
import { buildV2Headers } from '@/app/(app)/features/search/v2/v2-request';
import {
  buildPinsUrl,
  toSearchPins,
} from '@/app/(app)/features/search/v2/v2-pins';
import { API_URL } from '@/app/(app)/shared/lib/constants';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';
import { parsePinsQuery } from '@/app/(app)/shared/lib/search-params';
import { findResourcePins } from '@/app/(app)/shared/services/search-pins-service';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { isRouteDenied } from '@/lib/arcjet-page';
import { isValidLocale } from '@/payload/i18n/locales';

/** As long as the Redis entry behind it: pins only change on a reindex. */
const BROWSER_CACHE_SECONDS = 60 * 60;

/**
 * Every result's map pin for a search, fetched by the search map once the
 * list has rendered (see docs/map-pins.md). The tenant comes from the host,
 * never the query, so a request can only read the tenant it is sent to.
 */
export async function GET(request: NextRequest) {
  // Up to 10,000 locations a request: worth a scraper's while, so bots are stopped first.
  if (await isRouteDenied('/api/search-pins')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isV2 = request.nextUrl.searchParams.get('v2') === '1';
  const params = parsePinsQuery(request.nextUrl.search);
  const locale = params.locale;

  if (typeof locale !== 'string' || !isValidLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  // The same host-tenant check as `/api/v2-search` (enableV2Api on, locale offered), one function.
  if (isV2) {
    const host = await resolveV2HostTenant(locale, {
      getConfig: getAppConfigWithoutHost,
      isValidLocale,
    });
    if (!host.ok) {
      return NextResponse.json({ error: host.error }, { status: host.status });
    }
  }

  const appConfig = await getAppConfigWithoutHost(locale);

  if (
    !appConfig.search.showAllResultsOnMap ||
    !appConfig.i18n.locales.includes(locale)
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // v2 tenants only (`enableV2Api`): the same pins, from Norse-API `GET /v2/search/pins`. The key
  // stays on the server, and the path carries the version (ADR 0039).
  const pins = isV2
    ? await findV2Pins(request.nextUrl.searchParams, appConfig)
    : await findResourcePins(params, locale, appConfig.tenantId);

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

/** `null` when the upstream call fails, as `findResourcePins` does. */
async function findV2Pins(
  incoming: URLSearchParams,
  appConfig: { tenantId: string; search: AreaSettingsSource },
) {
  if (!API_URL) return null;
  const upstream = await fetch(
    buildPinsUrl(API_URL, incoming, appConfig.tenantId, appConfig.search),
    {
      headers: buildV2Headers(await getTenantApiKey(appConfig.tenantId)),
      cache: 'no-store',
    },
  ).catch(() => null);
  if (!upstream?.ok) return null;
  // A 200 with a body that is not JSON is a failed call, not an empty list.
  const body = await upstream.json().catch(() => null);
  return body ? toSearchPins(body) : null;
}
