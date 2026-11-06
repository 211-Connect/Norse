import qs from 'qs';

import { SearchEngine } from '@/types/appConfig';

import { type FindResourcesQuery } from '../services/search-service';
import { deriveQueryType } from './search-utils';

/**
 * The params that decide which resources a search matches, shared by the list
 * and its map pins so the two cannot disagree.
 */
export function toSearchParams({
  query,
  locale,
  tenantId,
  searchEngine,
}: {
  query: FindResourcesQuery;
  locale: string;
  tenantId?: string;
  searchEngine: SearchEngine;
}) {
  const hasCoords = query.coordinates?.length === 2;

  return {
    ...(query.query?.trim() && { query: query.query.trim() }),
    query_type: deriveQueryType({
      searchEngine,
      originQueryType: query.queryType,
      query: query.query,
    }),
    ...(query.organizationId && { organization_id: query.organizationId }),
    ...(Array.isArray(query.taxonomy) &&
      query.taxonomy.length > 0 && { taxonomy: query.taxonomy.join(',') }),
    ...(hasCoords && { coords: query.coordinates!.join(',') }),
    ...(hasCoords && { distance: query.distance?.trim() || '0' }),
    locale,
    ...(tenantId && { tenant_id: tenantId }),
    ...(query.filters &&
      Object.keys(query.filters).length > 0 && { filters: query.filters }),
    ...(query.age !== undefined && { age: query.age }),
  };
}

/** About a kilometre: close enough to share a cache entry, too close to change who is served. */
const PIN_COORDINATE_PRECISION = 100;

export const roundCoordinatesForPins = (coordinates?: number[]) =>
  coordinates?.map(
    (value) =>
      Math.round(value * PIN_COORDINATE_PRECISION) / PIN_COORDINATE_PRECISION,
  );

/** The params a pins request may carry; the tenant always comes from the host. */
const PINS_PARAMS = [
  'query',
  'query_type',
  'organization_id',
  'taxonomy',
  'coords',
  'distance',
  'locale',
  'filters',
  'age',
] as const;

/**
 * The query string of `/api/search-pins` for a search. Page, limit and sort
 * stay out so every page of a search is one browser and Redis cache entry,
 * and coordinates are rounded so nearby visitors share one too.
 */
export function toPinsQuery(
  query: FindResourcesQuery,
  locale: string,
  searchEngine: SearchEngine,
): string {
  return qs.stringify(
    toSearchParams({
      query: {
        ...query,
        coordinates: roundCoordinatesForPins(query.coordinates),
      },
      locale,
      searchEngine,
    }),
  );
}

/** A pins query string cut to the params it may carry, in a stable order. */
export function parsePinsQuery(search: string): Record<string, unknown> {
  const parsed = qs.parse(search.replace(/^\?/, ''));

  return Object.fromEntries(
    PINS_PARAMS.filter((key) => parsed[key] !== undefined).map((key) => [
      key,
      parsed[key],
    ]),
  );
}
