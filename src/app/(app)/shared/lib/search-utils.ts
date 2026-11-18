import { SearchEngine } from '@/types/appConfig';

/**
 * The wire-format sentinel for "no location filter": this literal string,
 * independent of locale. `search.everywhere` in common.json is only its display
 * label, so the search state must hold this value and never the translation
 * (see LocationSearchBar). A `location` matching it (case-insensitively) must
 * never be treated as a real place: not forward-geocoded, not sent as a
 * `location` query param.
 */
export const EVERYWHERE_LOCATION = 'Everywhere';

export function isEverywhereLocation(location: string | undefined | null) {
  return location?.trim().toLowerCase() === EVERYWHERE_LOCATION.toLowerCase();
}

/**
 * Valid query type options supported by the Norse API
 */
export enum QueryType {
  Text = 'text',
  Hybrid = 'hybrid',
  Taxonomy = 'taxonomy',
  MoreLikeThis = 'more_like_this',
}

const CODE_PATTERN = /^[a-zA-Z]{1,2}(-\d{1,4}([.-]\d{1,4}){0,3})?$/i;
const JSON_PATTERN = /^\{.*\}$/;

function isTaxonomyQuery(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  if (JSON_PATTERN.test(value)) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object';
    } catch {
      return false;
    }
  }

  return value.split(',').every((part) => CODE_PATTERN.test(part));
}

type DeriveQueryTypeArgs = {
  searchEngine: SearchEngine;
  originQueryType: string | undefined;
  query: string | undefined;
};

/**
 * Whether Norse-API runs this as a taxonomy search. Independent of the tenant's search engine: a
 * taxonomy search stays taxonomy on hybrid and AI tenants too.
 */
export function isTaxonomySearch(
  originQueryType: string | undefined,
  query: string | undefined,
): boolean {
  return originQueryType === 'taxonomy' || isTaxonomyQuery(query);
}

export function deriveQueryType({
  searchEngine,
  originQueryType,
  query,
}: DeriveQueryTypeArgs): QueryType {
  if (isTaxonomySearch(originQueryType, query)) {
    return QueryType.Taxonomy;
  }

  // 'v2' behaves like 'ai_classification' until the v2 UX ships (ISS-2499).
  return searchEngine === 'hybrid' ||
    searchEngine === 'ai_classification' ||
    searchEngine === 'v2'
    ? QueryType.Hybrid
    : QueryType.Text;
}
