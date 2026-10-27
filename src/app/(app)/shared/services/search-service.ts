'use server';

import qs from 'qs';

import { createLogger } from '@/lib/logger';
import { SearchEngine } from '@/types/appConfig';
import {
  FiltersMap,
  SearchApiResponse,
  SearchFacet,
  SearchHit,
} from '@/types/search';
import { ONE_HOUR, stableHash, withCache } from '@/utilities/withCache';
import { ensureUrlProtocol } from '@/utils';

import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { deriveQueryType } from '../lib/search-utils';
import { formatAddressForDisplay } from '../lib/utils';
import { ResultType } from '../store/results';
import { SortOption } from '../utils/getSortOption';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';
import { getApiHeaders } from '@/lib/api';

const log = createLogger('search');

export type FindResourcesQuery = {
  query?: string;
  queryLabel?: string;
  queryType?: string;
  organizationId?: string;
  taxonomy?: string[];
  location?: string;
  coordinates?: number[];
  distance?: string;
  /** Region id(s) to search as an area, e.g. `county:53077` (docs/area-search.md). */
  region?: string;
  filters?: Record<string, string[]>;
  sort?: SortOption;
  widgetId?: string;
  age?: number;
};

type SearchResult = {
  results: Record<string, unknown>[];
  totalResults: number;
  page: number;
  filters: FiltersMap;
};

/**
 * Extract total results count from search response
 */
function extractTotalResults(data: SearchApiResponse): number {
  return typeof data?.search?.hits?.total !== 'number'
    ? (data?.search?.hits?.total?.value ?? 0)
    : (data?.search?.hits?.total ?? 0);
}

/**
 * Transform search hits into result objects
 */
function transformSearchHits(
  hits: SearchHit[],
  locale: string,
  facetDefinitions: Record<string, { en: string; [key: string]: string }>,
): Record<string, unknown>[] {
  if (!Array.isArray(hits)) return [];

  return hits.map((hit: any) => {
    const physicalAddress = hit._source?.location?.physical_address;
    const mainAddress = formatAddressForDisplay(physicalAddress);

    const transformedFacets = transformFacetsToArray(
      hit?._source?.facets,
      facetDefinitions,
      locale,
    );

    const responseData: ResultType = {
      _id: hit._id,
      id: hit?._source?.service_at_location_id ?? null,
      alert: hit?._source?.service?.alert ?? null,
      alertDate: hit?._source?.service?.alertDate ?? null,
      priority: hit?._source?.priority,
      serviceName: hit?._source?.service?.name ?? null,
      attribution: hit?._source?.attribution ?? null,
      name: hit?._source?.name ?? null,
      locationName: hit?._source?.location?.name ?? null,
      organizationAlternateName:
        hit?._source?.organization?.alternate_name ?? null,
      summary: hit?._source?.service?.summary ?? null,
      description: hit?._source?.service?.description ?? null,
      phone: hit?._source?.phone ?? null,
      website: ensureUrlProtocol(hit?._source?.url),
      address: mainAddress,
      location: hit?._source?.location?.point ?? null,
      taxonomies: hit?._source?.taxonomies ?? null,
      eligibility: hit?._source?.service?.eligibility ?? null,
      applicationProcess: hit?._source?.service?.application_process ?? null,
      hours: hit?._source?.schedule ?? null,
      attributeValues: hit?._source?.attribute_values ?? null,
      facets: transformedFacets.length > 0 ? transformedFacets : null,
    };

    return Object.fromEntries(
      Object.entries(responseData).filter(([_, value]) => value != null),
    );
  });
}

function extractFilters(data: SearchApiResponse, _locale: string): FiltersMap {
  const facets: SearchFacet[] = data?.facets ?? [];
  return Object.fromEntries(
    facets
      .filter((f) => f.values.length > 0)
      .map((f) => [
        f.key,
        {
          name: f.name.locale,
          buckets: f.values.map((v) => ({
            key: v.en,
            display: v.locale,
            doc_count: v.doc_count,
          })),
        },
      ]),
  );
}

/**
 * Create empty search result
 */
function createEmptyResult(page: number): SearchResult {
  return {
    results: [],
    totalResults: 0,
    page,
    filters: {},
  };
}

type FindResourcesOriginArgs = {
  query: FindResourcesQuery;
  locale: string;
  page: number;
  limit?: number;
  tenantId: string;
  searchEngine: SearchEngine;
};

async function findResourcesOrigin({
  query,
  locale,
  page,
  limit,
  tenantId,
  searchEngine,
}: FindResourcesOriginArgs): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  const resolvedQueryType = deriveQueryType({
    searchEngine,
    originQueryType: query.queryType,
    query: query.query,
  });

  const hasCoords = query.coordinates?.length === 2;
  const hasRegion = Boolean(query.region?.trim());

  let data: SearchApiResponse | null | undefined;
  try {
    const searchString = qs.stringify({
      ...(query.query?.trim() && { query: query.query.trim() }),
      ...(query.queryLabel?.trim() && { query_label: query.queryLabel.trim() }),
      query_type: resolvedQueryType,
      ...(query.organizationId && { organization_id: query.organizationId }),
      ...(Array.isArray(query.taxonomy) &&
        query.taxonomy.length > 0 && { taxonomy: query.taxonomy.join(',') }),
      // `location` is only a label here and is not sent: the API would
      // geocode a `location` that comes without `coords`/`region`.
      ...(hasRegion && { region: query.region!.trim() }),
      ...(hasCoords && { coords: query.coordinates!.join(',') }),
      // A Region is searched as its shape: no radius.
      ...(hasCoords &&
        !hasRegion && { distance: query.distance?.trim() || '0' }),
      ...(query.sort && { sort: query.sort }),
      page,
      locale,
      limit,
      ...(tenantId && { tenant_id: tenantId }),
      ...(query.filters &&
        Object.keys(query.filters).length > 0 && { filters: query.filters }),
      ...(query.age !== undefined && { age: query.age }),
    });

    data = await fetchWrapper(`${API_URL}/search?${searchString}`, {
      headers: await getApiHeaders(tenantId, locale),
    });
  } catch (err) {
    log.error(
      { err, tenantId, query, page, locale, limit },
      'Search API error',
    );
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    log.error(
      { tenantId, page, locale, limit, query },
      'Malformed API response from search',
    );
    return createEmptyResult(page);
  }

  const totalResults = extractTotalResults(data);

  const hits = data?.search?.hits?.hits;
  const facetDefinitions = Object.fromEntries(
    (data.facets ?? []).map((f) => [
      f.key,
      { en: f.name.en, [locale]: f.name.locale },
    ]),
  );
  const results = transformSearchHits(hits, locale, facetDefinitions);
  const filters = extractFilters(data, locale);

  return {
    results,
    totalResults,
    page,
    filters,
  };
}

export async function findResources(
  query: FindResourcesQuery,
  locale: string,
  page: number,
  limit: number | undefined,
  tenantId: string,
  searchEngine: SearchEngine,
) {
  return withCache(
    `search_results:${tenantId}:${locale}:${stableHash({ query, page, limit, searchEngine })}`,
    () =>
      findResourcesOrigin({
        query,
        locale,
        page,
        limit,
        tenantId,
        searchEngine,
      }),
    { redis: true, memory: false, ttl: ONE_HOUR },
    (value) => value.results.length > 0,
  );
}
