import type { FindResourcesQuery } from '../services/search-service';

/**
 * True for the searches many visitors share: the first page of a category
 * (taxonomy) search with no location, filters or organization. These are
 * also kept in this instance's memory for 15 minutes, saving the Redis round
 * trip; every other search is cached in Redis only (docs/caching.md).
 */
export function isCommonSearch(
  query: FindResourcesQuery,
  page: number,
): boolean {
  const hasFilters = Object.values(query.filters ?? {}).some(
    (values) => Array.isArray(values) && values.length > 0,
  );
  return (
    page === 1 &&
    query.queryType === 'taxonomy' &&
    !hasFilters &&
    !query.location &&
    !query.coordinates?.length &&
    !query.region &&
    !query.organizationId
  );
}
