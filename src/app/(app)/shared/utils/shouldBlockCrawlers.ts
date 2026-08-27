/**
 * Decide whether search-engine crawlers should be blocked for the current
 * request, combining the global environment gate with a per-tenant opt-out.
 *
 * Two layers:
 *  1. Global master switch — crawlers are only ever allowed on a production
 *     deployment that has explicitly opted in via
 *     `NEXT_PUBLIC_ALLOW_SEARCH_ENGINES=true`. Any non-production build (dev,
 *     staging, preview) is fully de-indexed regardless of tenant settings.
 *  2. Per-tenant opt-out — once the global switch allows indexing, an
 *     individual branded tenant can still de-index itself by setting
 *     `seo.noindex` on its Payload `tenants` record.
 *
 * Edge-safe: only reads `process.env`, so it can be imported from middleware.
 *
 * @param tenantNoindex - the resolved `seo.noindex` flag for the request's
 *   tenant (defaults to `false`/indexable when the tenant is unknown).
 */
export function shouldBlockCrawlers(tenantNoindex: boolean): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowSearchEngines =
    process.env.NEXT_PUBLIC_ALLOW_SEARCH_ENGINES === 'true';
  const globallyIndexable = isProduction && allowSearchEngines;

  // Master switch off (non-prod or not opted in) → block every tenant.
  if (!globallyIndexable) {
    return true;
  }

  // Global switch allows indexing → defer to the per-tenant flag.
  return tenantNoindex;
}
