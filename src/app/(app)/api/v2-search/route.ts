import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import {
  buildV2Headers,
  buildV2Url,
  relayV2Response,
} from '@/app/(app)/features/search/v2/v2-request';
import { getTenantApiKey } from '@/lib/api/getTenantApiKey';

/**
 * Prototype (round 17): the browser's way to Norse-API `GET /v2/search`. The tenant key stays on the
 * server, as for every other Norse-API call. Tenant and language go in the URL only, with no
 * `x-tenant-id` or `accept-language` header (PR #331). Fails fast without a tenant (AGENTS.md).
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

  const upstream = await fetch(buildV2Url(API_URL, incoming, tenantId), {
    headers: buildV2Headers(await getTenantApiKey(tenantId)),
    cache: 'no-store',
  }).catch(() => null);
  const { status, body } = await relayV2Response(upstream);
  return NextResponse.json(body, { status });
}
