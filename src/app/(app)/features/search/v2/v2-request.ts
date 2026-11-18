/**
 * Prototype: the Norse-API `GET /v2/search` request, built by the page's server route. No React
 * and no server-only imports, so the unit tests can import it.
 *
 * Lucas, 2026-11-18 (Norse-API PR #331): on v2, tenant and language travel in the URL only
 * (`tenant_id`, `locale`). The `x-tenant-id` and `accept-language` headers are not sent, and
 * neither is `x-api-version` (the version is in the path). A copied URL alone reproduces the
 * exact search.
 */

import { v2FilterPairs } from './v2-contract';

/** The v2 parameters the draft contract names. Anything else on the page URL stays out of the call. */
export const V2_FORWARD = [
  'query',
  'needs',
  'passed_needs',
  'urgency',
  'clarify',
  'location',
  'coords',
  'distance',
  'taxonomy',
  'page',
] as const;

export const DEFAULT_LOCALE = 'en';

/** The upstream URL: the forwarded parameters, then `tenant_id` and `locale` (always both). */
export function buildV2Url(
  apiUrl: string,
  incoming: Pick<URLSearchParams, 'get'> & Partial<Pick<URLSearchParams, 'entries'>>,
  tenantId: string,
): string {
  const outgoing = new URLSearchParams();
  for (const key of V2_FORWARD) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }
  // Facet filters (`filters[...]`), `age`, `organization_id`, `geo_type` and the area params
  // (`region`, `area_match`, `unlocated`) go through as the page URL has them.
  if (incoming.entries) {
    for (const [key, value] of v2FilterPairs({ entries: incoming.entries.bind(incoming) })) {
      outgoing.append(key, value);
    }
  }
  outgoing.set('tenant_id', tenantId);
  outgoing.set('locale', incoming.get('locale') || DEFAULT_LOCALE);
  return `${apiUrl}/v2/search?${outgoing}`;
}

/** Only the tenant key goes in a header. Tenant and language are in the URL, never here. */
export function buildV2Headers(tenantApiKey?: string | null): Record<string, string> {
  return tenantApiKey ? { 'x-api-key': tenantApiKey } : {};
}

/**
 * What the page route answers for an upstream reply (Lucas, 2026-11-18). A 4xx passes through with
 * its status and body, so the page sees the real reason (for example 400 for `needs=N-X`). 502 stays
 * for a network failure (`null`) and for a 5xx or any other failure.
 */
export async function relayV2Response(
  upstream: Response | null,
): Promise<{ status: number; body: unknown }> {
  if (upstream?.ok) return { status: 200, body: await upstream.json() };
  if (upstream && upstream.status >= 400 && upstream.status < 500) {
    const text = await upstream.text().catch(() => '');
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = undefined;
    }
    return {
      status: upstream.status,
      body: body ?? { error: 'v2 search failed', status: upstream.status },
    };
  }
  return {
    body: { error: 'v2 search failed', status: upstream?.status ?? 0 },
    status: 502,
  };
}
