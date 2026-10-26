import { SearchQueryApiDto } from '@/lib/api/generated/data-contracts';

import type { QueryType } from '../lib/search-utils';
import type { FindResourcesQuery } from '../services/search-service';

/**
 * `location` is only the place's name, for the "Go to search results" link;
 * the API ignores it. `organization_id` is in the Norse API's
 * `SearchQueryApiDto` but not yet in the generated SDK: drop it here once
 * `npm run generate:api-sdk` picks it up.
 */
export type QuerySourceParams = SearchQueryApiDto &
  Pick<FindResourcesQuery, 'location'> & { organization_id?: string };

/**
 * The search params a query source stores: only the search keys, with
 * empty values dropped. Shared by creating and updating a
 * source so both store the same shape. The search's label is not a param:
 * it is the source's `title`.
 */
export function toQuerySourceParams(
  rawParams: Record<string, unknown>,
): QuerySourceParams {
  const params: QuerySourceParams = {};

  if (rawParams.age) {
    params.age = Number(rawParams.age);
  }

  if (rawParams.coords) {
    params.coords = String(rawParams.coords);

    if (rawParams.distance) {
      params.distance = Number(rawParams.distance);
    }

    if (rawParams.location) {
      params.location = String(rawParams.location);
    }
  }

  if (rawParams.filters && typeof rawParams.filters === 'object') {
    params.filters = rawParams.filters as SearchQueryApiDto['filters'];
  }

  if (rawParams.query) {
    params.query = String(rawParams.query);
  }

  if (rawParams.organization_id) {
    params.organization_id = String(rawParams.organization_id);
  }

  if (rawParams.query_type) {
    params.query_type = rawParams.query_type as QueryType;
  }

  if (
    rawParams.taxonomy &&
    (typeof rawParams.taxonomy === 'string' ||
      Array.isArray(rawParams.taxonomy))
  ) {
    params.taxonomy = rawParams.taxonomy as string | string[];
  }

  return params;
}
