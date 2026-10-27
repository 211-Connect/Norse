import { SearchEngine } from '@/types/appConfig';

/**
 * "Everywhere" is the wire-format sentinel for "no location filter" (the
 * literal string, independent of locale — see `search.everywhere` in
 * common.json). A `location` matching it (case-insensitively) must never be
 * treated as a real place: not forward-geocoded, not sent as a `location`
 * query param.
 */
export function isEverywhereLocation(location: string | undefined | null) {
  return location?.trim().toLowerCase() === 'everywhere';
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

export function deriveQueryType({
  searchEngine,
  originQueryType,
  query,
}: DeriveQueryTypeArgs): QueryType {
  if (originQueryType === 'taxonomy') {
    return QueryType.Taxonomy;
  }

  if (isTaxonomyQuery(query)) {
    return QueryType.Taxonomy;
  }

  return searchEngine === 'hybrid' || searchEngine === 'ai_classification'
    ? QueryType.Hybrid
    : QueryType.Text;
}
