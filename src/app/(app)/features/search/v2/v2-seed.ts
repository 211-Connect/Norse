/**
 * Prototype: the server-rendered first results of the results URL (v2-search--seo-urls, Lucas
 * 2026-11-11 Q4). No React and no server-only imports, so the unit tests can import it.
 *
 * Q4 = A: a plain search URL shows results; `refine=1` turns on the questions. Bots and people get
 * the same HTML (no cloaking). Everything here is a pure function of the `/v2/search` response.
 */
import type { V2Response } from './v2-contract';
import { totalOf, v2FilterPairs, withoutNX } from './v2-contract';

/** How many first results the HTML carries. The first page of the API is the cap. */
export const SEED_LIMIT = 25;

const SHORT_TEXT_MAX = 220;

export type SeedHit = {
  id: string;
  name: string;
  organization: string | null;
  text: string | null;
  href: string;
};

/** What the client hands to `useV2Search` so the first render needs no second call. */
export type V2Seed = {
  tenantId: string;
  /** The `v2CallString` of the URL: the query-cache key the hook uses. */
  callString: string;
  data: V2Response;
  /** Epoch ms of the server fetch, for the cache's freshness clock. */
  fetchedAt: number;
};

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/** Cut at a word end near `max`, with an ellipsis. */
export function shortText(text: string, max = SHORT_TEXT_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:]+$/, '')}…`;
}

/** The resource page of a hit. The id is the Elasticsearch `_id`, as for the v1 cards. */
export const hitHref = (id: string) => `/search/${encodeURIComponent(id)}`;

/** The first results as plain data: name, organization, short text, link. Hits with no name are dropped. */
export function seedHits(
  response: V2Response | null | undefined,
  limit = SEED_LIMIT,
): SeedHit[] {
  const hits = response?.search?.hits?.hits ?? [];
  const out: SeedHit[] = [];
  for (const hit of hits) {
    const source = obj(hit._source);
    const service = obj(source.service);
    const organization = obj(source.organization);
    const name = str(service.name) ?? str(source.name);
    if (!hit._id || !name) continue;
    const org =
      str(organization.name) ??
      str(organization.alternate_name) ??
      str(source.name);
    const text =
      str(service.summary) ??
      str(service.short_description) ??
      str(service.description);
    out.push({
      id: String(hit._id),
      name,
      organization: org && org !== name ? org : null,
      text: text ? shortText(text) : null,
      href: hitHref(String(hit._id)),
    });
    if (out.length >= limit) break;
  }
  return out;
}

export const seedTotal = (response: V2Response | null | undefined) =>
  response ? totalOf(response) : 0;

/** True when the seed belongs to this call, so the hook may start from it. */
export const seedMatches = (
  seed: Pick<V2Seed, 'tenantId' | 'callString'> | null | undefined,
  tenantId: string | undefined,
  callString: string,
): boolean =>
  Boolean(seed) &&
  seed!.tenantId === tenantId &&
  seed!.callString === callString;

/** The draft v2 parameters, in the order the call sends them. */
const CALL_KEYS = [
  'query',
  'needs',
  'passed_needs',
  'urgency',
  'taxonomy',
  'location',
  'coords',
  'distance',
  'page',
  'sort',
] as const;

/** The `/v2/search` parameters of a page URL, in one stable string (the query cache key). */
export function v2CallString(
  params: Pick<URLSearchParams, 'get' | 'entries'>,
): string {
  const call = new URLSearchParams();
  for (const key of CALL_KEYS) {
    const raw = params.get(key);
    const value = key === 'needs' ? withoutNX(raw) : raw;
    if (value) call.set(key, value);
  }
  // Facet filters and area params are result-changing, so they are in the cache key too.
  for (const [key, value] of v2FilterPairs(params)) call.append(key, value);
  return call.toString();
}
