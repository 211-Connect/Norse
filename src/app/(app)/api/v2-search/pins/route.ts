import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import { buildV2Headers } from '@/app/(app)/features/search/v2/v2-request';
import { buildPinsUrl } from '@/app/(app)/features/search/v2/v2-pins';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';

/**
 * Prototype: the browser's way to Norse-API `GET /v2/search/pins` (PR #330). Same rules as
 * `../route.ts`: the tenant key stays on the server, tenant and language go in the URL only, and
 * the version is in the path (no `x-api-version` header).
 */
export async function GET(request: NextRequest) {
  const incoming = request.nextUrl.searchParams;
  const tenantId = incoming.get('tenant_id');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }
  if (!API_URL) {
    return NextResponse.json({ error: 'API_URL is not configured' }, { status: 500 });
  }

  const upstream = await fetch(buildPinsUrl(API_URL, incoming, tenantId), {
    headers: buildV2Headers(await getTenantApiKey(tenantId)),
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
