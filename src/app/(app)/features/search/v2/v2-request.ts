/**
 * Prototype: the Norse-API `GET /v2/search` request, built by the page's server route. No React
 * and no server-only imports, so the unit tests can import it.
 *
 * Lucas, 2026-11-18 (Norse-API PR #331): on v2, tenant and language travel in the URL only
 * (`tenant_id`, `locale`). The `x-tenant-id` and `accept-language` headers are not sent, and
 * neither is `x-api-version` (the version is in the path). A copied URL alone reproduces the
 * exact search.
 */

/** The v2 parameters the draft contract names. Anything else on the page URL stays out of the call. */
export const V2_FORWARD = [
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
  'page',
] as const;

export const DEFAULT_LOCALE = 'en';

/** The upstream URL: the forwarded parameters, then `tenant_id` and `locale` (always both). */
export function buildV2Url(
  apiUrl: string,
  incoming: Pick<URLSearchParams, 'get'>,
  tenantId: string,
): string {
  const outgoing = new URLSearchParams();
  for (const key of V2_FORWARD) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }
  outgoing.set('tenant_id', tenantId);
  outgoing.set('locale', incoming.get('locale') || DEFAULT_LOCALE);
  return `${apiUrl}/v2/search?${outgoing}`;
}

/** Only the tenant key goes in a header. Tenant and language are in the URL, never here. */
export function buildV2Headers(tenantApiKey?: string | null): Record<string, string> {
  return tenantApiKey ? { 'x-api-key': tenantApiKey } : {};
}
