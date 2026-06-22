'use server';

import qs from 'qs';

import { createLogger } from '@/lib/logger';
import { BBox } from '@/types/resource';
import {
  FiltersMap,
  SearchApiResponse,
  SearchFacet,
  SearchHit,
} from '@/types/search';
import { ONE_HOUR, stableHash, withCache } from '@/utilities/withCache';
import { ensureUrlProtocol } from '@/utils';

import { API_URL, INTERNAL_API_KEY } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { buildSearchRequest, deriveQueryType } from '../lib/search-utils';
import { formatAddressForDisplay } from '../lib/utils';
import { ResultType } from '../store/results';
import { SortOption } from '../utils/getSortOption';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';

const log = createLogger('search');

export type FindResourcesQuery = {
  query?: string;
  queryLabel?: string;
  queryType?: string;
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
      priority: hit?._source?.priority,
      serviceName: hit?._source?.service?.name ?? null,
      attribution: hit?._source?.attribution ?? null,
      name: hit?._source?.name ?? null,
      locationName: hit?._source?.location?.name ?? null,
      summary: hit?._source?.service?.summary ?? null,
      description: hit?._source?.service?.description ?? null,
      phone: hit?._source?.phone ?? null,
      website: ensureUrlProtocol(hit?._source?.url),
      address: mainAddress,
      location: hit?._source?.location?.point ?? null,
      taxonomies: hit?._source?.taxonomies ?? null,
      eligibility: hit?._source?.service?.eligibility ?? null,
      applicationProcess: hit?._source?.service?.application_process ?? null,
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
  tenantId?: string;
  hybridSemanticSearchEnabled: boolean | undefined;
};

async function findResourcesOrigin({
  query,
  locale,
  page,
  limit,
  tenantId,
  hybridSemanticSearchEnabled,
}: FindResourcesOriginArgs): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  const resolvedQueryType = deriveQueryType({
    hybridSemanticSearchEnabled,
    originQueryType: query.queryType,
    query: query.query,
  });

  const hasCoords = query.coordinates?.length === 2;

  let data: SearchApiResponse | null | undefined;
  try {
    const searchString = qs.stringify({
      ...(query.query?.trim() && { query: query.query.trim() }),
      ...(query.queryLabel?.trim() && { query_label: query.queryLabel.trim() }),
      query_type: resolvedQueryType,
      ...(Array.isArray(query.taxonomy) &&
        query.taxonomy.length > 0 && { taxonomy: query.taxonomy.join(',') }),
      ...(query.location?.trim() && { location: query.location.trim() }),
      ...(hasCoords && { coords: query.coordinates!.join(',') }),
      ...(hasCoords && { distance: query.distance?.trim() || '0' }),
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
      headers: {
        'accept-language': locale,
        'x-api-version': '1',
        'x-api-key': INTERNAL_API_KEY || '',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      cache: 'no-store',
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
  tenantId: string | undefined,
  hybridSemanticSearchEnabled: boolean | undefined,
) {
  return withCache(
    `search_results:${tenantId}:${locale}:${stableHash({ query, page, limit })}`,
    () =>
      findResourcesOrigin({
        query,
        locale,
        page,
        limit,
        tenantId,
        hybridSemanticSearchEnabled,
      }),
    { redis: true, memory: false, ttl: ONE_HOUR },
    (value) => value.results.length > 0,
  );
}

/**
 * Find resources using POST endpoint with advanced geospatial filtering
 * This is the V2 implementation that supports both boundary and proximity search
 * @param searchStore - Search state from searchAtom
 * @param locale - Language locale
 * @param page - Current page number
 * @param limit - Results per page
 * @param tenantId - Tenant identifier
 * @param hybridSemanticSearchEnabled - Flag to enable hybrid semantic search which may affect query type derivation
 * @returns Search results with pagination info
 */
export async function findResourcesV2(
  searchStore: FindResourcesQuery,
  locale: string,
  page: number,
  limit: number | undefined,
  tenantId: string | undefined,
  hybridSemanticSearchEnabled: boolean | undefined,
): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  const request = buildSearchRequest(searchStore, hybridSemanticSearchEnabled);
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
        'accept-language': locale,
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      body: request.body,
    });
  } catch (err) {
    log.error(
      { err, url: searchUrl, tenantId, page, locale, limit },
      'Search API error (V2)',
    );
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    log.error(
      { url: searchUrl, tenantId, page, locale, limit },
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
