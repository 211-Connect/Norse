import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { resolveV2HostTenant } from '@/app/(app)/features/search/v2/v2-host-tenant';
import { buildV2Headers } from '@/app/(app)/features/search/v2/v2-request';
import { buildPinsUrl } from '@/app/(app)/features/search/v2/v2-pins';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';
import { isValidLocale } from '@/payload/i18n/locales';

/**
 * Prototype: the browser's way to Norse-API `GET /v2/search/pins` (PR #330). Same rules as
 * `../route.ts` (tenant from the host, not the query; `resolveV2HostTenant`): the tenant key stays on the server, tenant and language go in the URL only, and
 * the version is in the path (no `x-api-version` header).
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

  const upstream = await fetch(buildPinsUrl(API_URL, incoming, host.tenantId), {
    headers: buildV2Headers(await getTenantApiKey(host.tenantId)),
    cache: 'no-store',
  }).catch(() => null);
  if (!upstream?.ok) {
    return NextResponse.json(
      { error: 'v2 pins failed', status: upstream?.status ?? 0 },
      { status: 502 },
    );
  }
  return NextResponse.json(await upstream.json());
}
