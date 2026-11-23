import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { resolveV2HostTenant } from '@/app/(app)/features/search/v2/v2-host-tenant';
import {
  buildV2Headers,
  buildV2Url,
  relayV2Response,
} from '@/app/(app)/features/search/v2/v2-request';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';
import { isValidLocale } from '@/payload/i18n/locales';

/**
 * Prototype (round 17): the browser's way to Norse-API `GET /v2/search`. The tenant key stays on the
 * server, as for every other Norse-API call. The tenant comes from the request host, never from the
 * query, as for v1 `/api/search-pins` (`resolveV2HostTenant`, shared with the v2 pins call): a
 * `tenant_id` in the browser query is ignored, so a request can only read the tenant it is sent to.
 * Tenant and language still go in the outgoing URL (`tenant_id`, `locale`) with no `x-tenant-id` or
 * `accept-language` header (PR #331; Decision 34, the Norse-API #321 CDN cache key).
 */
export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const host = await resolveV2HostTenant(incoming.get('locale'), {
    getConfig: getAppConfigWithoutHost,
    isValidLocale,
  });
  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }
  if (!API_URL) {
    return NextResponse.json(
      { error: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    buildV2Url(API_URL, incoming, host.tenantId, host.search),
    {
      headers: buildV2Headers(await getTenantApiKey(host.tenantId)),
      cache: 'no-store',
    },
  ).catch(() => null);
  const { status, body } = await relayV2Response(upstream);
  return NextResponse.json(body, { status });
}
