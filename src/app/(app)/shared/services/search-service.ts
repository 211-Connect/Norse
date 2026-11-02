'use server';

import qs from 'qs';

import { createLogger } from '@/lib/logger';
import { recordSearch } from '@/lib/telemetry/search';
import { SearchEngine } from '@/types/appConfig';
import { BBox } from '@/types/resource';
import {
  FiltersMap,
  SearchApiResponse,
  SearchFacet,
  SearchHit,
} from '@/types/search';
import { ONE_HOUR, stableHash, withCache } from '@/utilities/withCache';
import { ensureUrlProtocol } from '@/utils';

import { API_URL } from '../lib/constants';
import { FetchError } from '../lib/fetchError';
import { fetchWrapper } from '../lib/fetchWrapper';
import { toSearchParams } from '../lib/search-params';
import { buildSearchRequest } from '../lib/search-utils';
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
  placeType?: string[];
  bbox?: BBox;
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

  let data: SearchApiResponse | null | undefined;
  try {
    const searchString = qs.stringify({
      ...toSearchParams({ query, locale, tenantId, searchEngine }),
      ...(query.queryLabel?.trim() && { query_label: query.queryLabel.trim() }),
      ...(query.location?.trim() && { location: query.location.trim() }),
      ...(query.sort && { sort: query.sort }),
      page,
      limit,
    });

    data = await fetchWrapper(`${API_URL}/search?${searchString}`, {
      headers: await getApiHeaders(tenantId, locale),
      telemetry: { dependency: 'norse_api', operation: 'search_v1' },
    });
  } catch (err) {
    log.error(
      {
        errName: err instanceof Error ? err.name : typeof err,
        status: err instanceof FetchError ? err.response.status : undefined,
        api: 'v1',
        tenantId,
        page,
        locale,
        limit,
      },
      'Search API error',
    );
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    log.error(
      { api: 'v1', tenantId, page, locale, limit },
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
  let cacheHit = false;
  const result = await withCache(
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
    (hit) => {
      cacheHit = hit;
    },
  );

  // Only the shape of the search is recorded: never the query, location,
  // coordinates, taxonomy or filters (privacy rule 8).
  recordSearch({
    api: 'v1',
    engine: searchEngine,
    page: result?.page ?? (Number.isNaN(page) ? 1 : page),
    limit: !limit || Number.isNaN(limit) ? 25 : limit,
    results: result?.results.length ?? 0,
    totalResults: result?.totalResults ?? 0,
    cacheHit,
  });

  return result;
}

/**
 * Find resources using POST endpoint with advanced geospatial filtering
 * This is the V2 implementation that supports both boundary and proximity search
 * @param searchStore - Search state from searchAtom
 * @param locale - Language locale
 * @param page - Current page number
 * @param limit - Results per page
 * @param tenantId - Tenant identifier
 * @param searchEngine - Active search engine mode
 * @returns Search results with pagination info
 */
async function findResourcesV2Origin(
  searchStore: FindResourcesQuery,
  locale: string,
  page: number,
  limit: number | undefined,
  tenantId: string,
  searchEngine: SearchEngine,
): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  const request = buildSearchRequest(searchStore, searchEngine);
  const queryParams = qs.stringify({
    ...request.queryParams,
    page,
    locale,
    limit,
    ...(searchStore.sort && { sort: searchStore.sort }),
    ...(Array.isArray(searchStore.taxonomy) && searchStore.taxonomy.length > 0
      ? { taxonomy: searchStore.taxonomy.join(',') }
      : {}),
    ...(searchStore.filters && Object.keys(searchStore.filters).length > 0
      ? { filters: searchStore.filters }
      : {}),
    ...(searchStore.age !== undefined && { age: searchStore.age }),
  });
  const searchUrl = `${API_URL}/search?${queryParams}`;

  let data: SearchApiResponse | null | undefined;
  try {
    data = await fetchWrapper(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getApiHeaders(tenantId, locale)),
      },
      body: request.body,
      telemetry: { dependency: 'norse_api', operation: 'search_v2' },
    });
  } catch (err) {
    log.error(
      {
        errName: err instanceof Error ? err.name : typeof err,
        status: err instanceof FetchError ? err.response.status : undefined,
        api: 'v2',
        tenantId,
        page,
        locale,
        limit,
      },
      'Search API error (V2)',
    );
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    log.error(
      { api: 'v2', tenantId, page, locale, limit },
      'Malformed API response from search (V2)',
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

export async function findResourcesV2(
  searchStore: FindResourcesQuery,
  locale: string,
  page: number,
  limit: number | undefined,
  tenantId: string,
  searchEngine: SearchEngine,
): Promise<SearchResult> {
  let cacheHit = false;
  const cached = await withCache(
    `search_results:${tenantId}:${locale}:${stableHash({ query: searchStore, page, limit, searchEngine, version: 'v2' })}`,
    () =>
      findResourcesV2Origin(
        searchStore,
        locale,
        page,
        limit,
        tenantId,
        searchEngine,
      ),
    { redis: true, memory: true, ttl: ONE_HOUR },
    (value) => value.results.length > 0,
    (hit) => {
      cacheHit = hit;
    },
  );
  const result = cached ?? createEmptyResult(page);

  // Same allowlist as v1: shape only, never search text (privacy rule 8).
  recordSearch({
    api: 'v2',
    engine: searchEngine,
    page: result.page,
    limit: !limit || Number.isNaN(limit) ? 25 : limit,
    results: result.results.length,
    totalResults: result.totalResults,
    cacheHit,
  });

  return result;
}
