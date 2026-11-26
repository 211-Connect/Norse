/**
 * A landing page's search (docs/landing-pages.md, "The page"): the topic's
 * stored search plus an area search on the page's region, fixed by the path.
 * The query string may only refine it (page, sort, age, filters). Pure, so
 * the page, the client navigation and the warm-up job build the same search.
 */
import { buildSearchUrl } from '@/app/(app)/features/search/utils/buildSearchUrl';
import type { SearchEngine } from '@/types/appConfig';

import type { LandingSearch } from './types';

export type RawParams = Record<string, string | string[] | undefined>;

/** URL keys that refine a landing page's search without leaving it. */
export function isRefinementKey(key: string): boolean {
  return (
    key === 'page' ||
    key === 'sort' ||
    key === 'age' ||
    key === 'filters' ||
    key.startsWith('filters[')
  );
}

/** Refinements other than the page number: they make a `noindex` variant. */
export function isFilteringKey(key: string): boolean {
  return isRefinementKey(key) && key !== 'page';
}

/**
 * The search the path fixes, as the `/search` URL parameters a visitor's
 * search for the same topic and place would have.
 */
export function landingBaseParams({
  search,
  topicName,
  regionId,
  location,
  searchEngine,
}: {
  search: LandingSearch;
  topicName: string;
  /** None for a topic's hub: the search covers the whole tenant. */
  regionId: string | null;
  /** The place as the location field shows it, e.g. "Tacoma, WA"; none for a hub. */
  location: string | null;
  searchEngine: SearchEngine;
}): [string, string][] {
  const url = buildSearchUrl({
    query: search.query,
    queryLabel: topicName,
    queryType: search.queryType,
    location: location ?? undefined,
    region: regionId ?? undefined,
    searchEngine,
  });
  const query = url.slice(url.indexOf('?') + 1);
  return [...new URLSearchParams(query)];
}

const pairsOf = (params: RawParams): [string, string][] =>
  Object.entries(params).flatMap(([key, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map(
          (v) => [key, v] as [string, string],
        ),
  );

const toRaw = (pairs: [string, string][]): RawParams => {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of pairs) {
    const previous = out[key];
    out[key] =
      previous === undefined
        ? value
        : Array.isArray(previous)
          ? [...previous, value]
          : [previous, value];
  }
  return out;
};

/** The request's refinements only, as raw parameters. */
export function landingRefinements(requestParams: RawParams): RawParams {
  return toRaw(pairsOf(requestParams).filter(([key]) => isRefinementKey(key)));
}

/** The full search: the fixed base plus the request's refinements. */
export function landingSearchParams(
  base: [string, string][],
  requestParams: RawParams,
): RawParams {
  const refinements = pairsOf(requestParams).filter(([key]) =>
    isRefinementKey(key),
  );
  return toRaw([...base, ...refinements]);
}

/** Whether the request refines the search beyond a page number. */
export function isRefinedRequest(requestParams: RawParams): boolean {
  return pairsOf(requestParams).some(([key]) => isFilteringKey(key));
}

/** `?page=n` as a number from 1, or 1. */
export function requestedPage(requestParams: RawParams): number {
  const value = requestParams.page;
  const first = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(first ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/**
 * Where a search URL (`…/search?…`, as the search writers produce it) goes
 * from a landing page: back to the landing page with its refinements when the
 * search is still the page's own, else the `/search` URL unchanged.
 *
 * @param path The landing page's path with its locale prefix.
 * @param base The page's fixed search (`landingBaseParams`).
 */
export function toLandingHref(
  searchUrl: string,
  path: string,
  base: [string, string][],
): string {
  const at = searchUrl.indexOf('?');
  const pairs = [...new URLSearchParams(at < 0 ? '' : searchUrl.slice(at + 1))];
  const rest = pairs.filter(([key]) => isRefinementKey(key));
  const fixed = pairs.filter(([key]) => !isRefinementKey(key));
  const sameSearch =
    fixed.length === base.length &&
    base.every(([key, value]) =>
      fixed.some(([k, v]) => k === key && v === value),
    );
  if (!sameSearch) return searchUrl;
  const query = new URLSearchParams(rest).toString();
  return query ? `${path}?${query}` : path;
}
