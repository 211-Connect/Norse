// The demo stub's call to the live v2 search. The stub reads the page's parameters and sends them on:
// what the stub knows (tenant, coords, the relevance cut) it sets, and every other v2 parameter
// (sort, distance, location, region, filters, ...) goes through as the page sent it.
import { readParams } from './v2-search';

/** Page parameters the stub sets itself or renames. Everything else is forwarded. */
const OWN_KEYS = new Set([
  'tenant_id',
  'locale',
  'query',
  'q',
  'needs',
  'passed_needs',
  'urgency',
  'clarify',
  'relevance_cutoff',
]);

export function upstreamV2Url(
  page: URLSearchParams,
  env: { upstream: string; tenant: string; coords?: string; cutoff?: string },
): URL {
  const v2 = readParams(page);
  const up = new URL('/v2/search', env.upstream);
  // Tenant and language go in the URL (PR #331), no headers; the live tenant replaces the stub tenant the page sent.
  up.searchParams.set('tenant_id', env.tenant);
  up.searchParams.set('locale', page.get('locale') || 'en');
  up.searchParams.set('query', v2.query);
  if (v2.needs.length) up.searchParams.set('needs', v2.needs.join(','));
  if (v2.passedNeeds.length)
    up.searchParams.set('passed_needs', v2.passedNeeds.join(','));
  if (v2.urgency) up.searchParams.set('urgency', v2.urgency);
  if (v2.clarify === 'never') up.searchParams.set('clarify', 'never');
  for (const [key, value] of page.entries()) {
    if (OWN_KEYS.has(key)) continue;
    // `taxonomy` from the page holds N- need codes, which v2 reads as `needs` (it filters on `taxonomy`).
    if (key === 'taxonomy' && value.startsWith('N-')) continue;
    up.searchParams.append(key, value);
  }
  // An area search (region) must not get a made-up point.
  if (env.coords && !page.get('coords') && !page.get('region'))
    up.searchParams.set('coords', env.coords);
  // Lucas 2026-11-18 (4A): the relevance cut is OFF in the demo for now (it costs 3-9 extra ES calls, about
  // +1 s a search). Without it a search returns the whole area. V2_CUTOFF=on turns it on.
  up.searchParams.set('relevance_cutoff', env.cutoff === 'on' ? 'on' : 'off');
  return up;
}
