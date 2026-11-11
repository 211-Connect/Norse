import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/app/(app)/shared/lib/constants';
import { getApiHeaders } from '@/lib/api';

/** The v2 parameters the draft contract names. Anything else on the page URL stays out of the call. */
const FORWARD = [
  'query',
  'other',
  'needs',
  'passed_needs',
  'urgency',
  'clarify',
  'location',
  'coords',
  'distance',
  'taxonomy',
] as const;

/**
 * Prototype (round 17): the browser's way to Norse-API `GET /v2/search`. The tenant key stays on the
 * server, as for every other Norse-API call. Fails fast without a tenant (AGENTS.md).
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

  const outgoing = new URLSearchParams();
  for (const key of FORWARD) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }
  const locale = incoming.get('locale') ?? 'en';

  const upstream = await fetch(`${API_URL}/v2/search?${outgoing}`, {
    headers: await getApiHeaders(tenantId, locale),
    cache: 'no-store',
  }).catch(() => null);
  if (!upstream?.ok) {
    return NextResponse.json(
      { error: 'v2 search failed', status: upstream?.status ?? 0 },
      { status: 502 },
    );
  }
  return NextResponse.json(await upstream.json());
}
