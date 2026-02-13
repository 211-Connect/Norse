import { ExtractAtomValue } from 'jotai';

import { buildSearchRequest, deriveQueryType } from '../lib/search-utils';
import { searchAtom } from '../store/search';
import { API_URL, INTERNAL_API_KEY } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';
import { BBox } from '@/types/resource';
import qs from 'qs';

export type FindResourcesQuery = {
  query: string;
  queryLabel: string;
  queryType: string;
  searchLocation: string;
  searchCoordinates: number[];
  searchDistance: string;
  searchPlaceType: string[] | undefined;
  searchBbox: BBox | undefined;
};

type SearchResult = {
  results: any[];
  noResults: boolean;
  totalResults: number;
  page: number;
  filters: Record<string, any>;
};

export function createUrlParamsForSearch(
  searchStore: ExtractAtomValue<typeof searchAtom>,
) {
  const hasLocation = searchStore['searchCoordinates']?.length === 2;

  const urlParams = {
    query: searchStore['query']?.trim(),
    query_label: searchStore['queryLabel']?.trim(),
    query_type: deriveQueryType(searchStore['query'], searchStore['queryType']),
    location: hasLocation ? searchStore['searchLocation']?.trim() : null,
    coords: hasLocation
      ? searchStore['searchCoordinates']?.join(',')?.trim()
      : null,
    distance:
      searchStore['searchCoordinates']?.length === 2
        ? searchStore['searchDistance']?.trim() || '0'
        : '',
  };

  return Object.fromEntries(
    Object.entries(urlParams).filter(
      ([_, value]) =>
        value != null && (typeof value !== 'string' || value.trim() !== ''),
    ),
  ) as Record<string, string>;
}

/**
 * Extract total results count from search response
 */
function extractTotalResults(data: any): number {
  return typeof data?.search?.hits?.total !== 'number'
    ? (data?.search?.hits?.total?.value ?? 0)
    : (data?.search?.hits?.total ?? 0);
}

/**
 * Transform search hits into result objects
 */
function transformSearchHits(
  hits: any[],
  locale?: string,
  facetDefinitions?: any,
): any[] {
  if (!Array.isArray(hits)) return [];

  return hits.map((hit: any) => {
    const physicalAddress = hit._source?.location?.physical_address;
    let mainAddress: string | null = null;

    if (
      physicalAddress?.address_1 &&
      physicalAddress?.city &&
      physicalAddress?.state &&
      physicalAddress?.postal_code
    ) {
      const addressParts = [
        physicalAddress.address_1,
        physicalAddress.address_2 ? physicalAddress.address_2 : null,
        physicalAddress.city,
        physicalAddress.state,
        physicalAddress.postal_code,
      ].filter(Boolean);

      mainAddress = addressParts.join(', ');
    }

    const responseData: Record<string, any> = {
      _id: hit._id,
      id: hit?._source?.service_at_location_id ?? null,
      priority: hit?._source?.priority,
      serviceName: hit?._source?.service?.name ?? null,
      name: hit?._source?.name ?? null,
      summary: hit?._source?.service?.summary ?? null,
      description: hit?._source?.service?.description ?? null,
      phone: hit?._source?.phone ?? null,
      website: hit?._source?.url ?? null,
      address: mainAddress,
      location: hit?._source?.location?.point ?? null,
      taxonomies: hit?._source?.taxonomies ?? null,
    };

    // Add facets if available (V1 only)
    if (facetDefinitions && locale) {
      const transformedFacets = transformFacetsToArray(
        hit?._source?.facets,
        facetDefinitions,
        locale,
      );
      if (transformedFacets.length > 0) {
        responseData.facets = transformedFacets;
      }
    }

    return Object.fromEntries(
      Object.entries(responseData).filter(([_, value]) => value != null),
    );
  });
}

/**
 * Extract and filter aggregations from search response
 */
function extractFilters(data: any): Record<string, any> {
  const aggregations = data?.search?.aggregations ?? {};
  return Object.keys(aggregations).reduce(
    (acc, key) => {
      const buckets = aggregations[key]?.buckets;
      if (
        !key.startsWith('label_') &&
        !key.endsWith('_en') &&
        Array.isArray(buckets) &&
        buckets.length > 0
      ) {
        acc[key] = aggregations[key];
      }
      return acc;
    },
    {} as Record<string, any>,
  );
}

/**
 * Create empty search result
 */
function createEmptyResult(page: number): SearchResult {
  return {
    results: [],
    noResults: true,
    totalResults: 0,
    page,
    filters: {},
  };
}

export async function findResources(
  query: any,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  let data;
  try {
    const searchParams = new URLSearchParams({
      ...query,
      page: String(page),
      locale,
      limit: String(limit),
    });

    if (tenantId) {
      searchParams.append('tenant_id', tenantId);
    }

    data = await fetchWrapper(`${API_URL}/search?${searchParams.toString()}`, {
      headers: {
        'accept-language': locale,
        'x-api-version': '1',
        'x-api-key': INTERNAL_API_KEY || '',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('Search API error:', {
      error: err,
      tenantId,
      query,
      page,
      locale,
      limit,
    });
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    console.error('Malformed API response:', {
      data,
      tenantId,
      query,
      page,
      locale,
      limit,
    });
    return createEmptyResult(page);
  }

  let totalResults = extractTotalResults(data);
  let noResults = false;

  // Try fallback search if no results
  if (totalResults === 0) {
    noResults = true;
    data =
      (await tryFallbackSearch(query, page, locale, limit, tenantId)) ?? data;
    totalResults = extractTotalResults(data);
  }

  const hits = data?.search?.hits?.hits;
  const facetDefinitions = data?.facets;
  const results = transformSearchHits(hits, locale, facetDefinitions);
  const filters = extractFilters(data);

  return {
    results,
    noResults,
    totalResults,
    page,
    filters,
  };
}

/**
 * Try fallback search with more_like_this query type
 */
async function tryFallbackSearch(
  query: any,
  page: number,
  locale: string,
  limit: number,
  tenantId?: string,
): Promise<any | null> {
  try {
    const fallbackParams = new URLSearchParams({
      ...query,
      page: String(page),
      query_type: 'more_like_this',
      locale,
      limit: String(limit),
    });

    if (tenantId) {
      fallbackParams.append('tenant_id', tenantId);
    }

    const fallbackData = await fetchWrapper(
      `${API_URL}/search?${fallbackParams.toString()}`,
      {
        headers: {
          'accept-language': locale,
          'x-api-version': '1',
          'x-api-key': INTERNAL_API_KEY || '',
          ...(tenantId && { 'x-tenant-id': tenantId }),
        },
        cache: 'no-store',
      },
    );

    return fallbackData?.search ? fallbackData : null;
  } catch (err) {
    console.error('Fallback search API error:', {
      error: err,
      tenantId,
      query: { ...query, query_type: 'more_like_this' },
      page,
      locale,
      limit,
    });
    return null;
  }
}

/**
 * Try fallback search with more_like_this query type for V2
 */
async function tryFallbackSearchV2(
  request: any,
  page: number,
  locale: string,
  limit: number,
  tenantId?: string,
): Promise<any | null> {
  try {
    const fallbackQueryParams = qs.stringify({
      ...request.queryParams,
      page,
      query_type: 'more_like_this',
      locale,
      limit,
    });
    const fallbackUrl = `${API_URL}/search?${fallbackQueryParams}`;

    const fallbackData = await fetchWrapper(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': locale,
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      body: request.body,
    });

    return fallbackData?.search ? fallbackData : null;
  } catch (err) {
    console.error('Fallback search API error (V2):', { error: err, tenantId });
    return null;
  }
}

/**
 * Find resources using POST endpoint with advanced geospatial filtering
 * This is the V2 implementation that supports both boundary and proximity search
 * @param searchStore - Search state from searchAtom
 * @param locale - Language locale
 * @param page - Current page number
 * @param limit - Results per page
 * @param tenantId - Tenant identifier
 * @returns Search results with pagination info
 */
export async function findResourcesV2(
  searchStore: FindResourcesQuery,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<SearchResult> {
  if (isNaN(page)) page = 1;
  if (!limit || isNaN(limit)) limit = 25;

  const request = buildSearchRequest(searchStore);
  const queryParams = qs.stringify({
    ...request.queryParams,
    page,
    locale,
    limit,
  });
  const searchUrl = `${API_URL}/search?${queryParams}`;

  let data;
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
    console.error('Search API error (V2):', {
      error: err,
      url: searchUrl,
      method: request.method,
      tenantId,
      queryParams: request.queryParams,
      hasGeometry: !!request.body.geometry,
      page,
      locale,
      limit,
    });
    return createEmptyResult(page);
  }

  if (!data || !data.search) {
    console.error('Malformed API response (V2):', {
      data,
      url: searchUrl,
      tenantId,
      page,
      locale,
      limit,
    });
    return createEmptyResult(page);
  }

  let totalResults = extractTotalResults(data);
  let noResults = false;

  // Try fallback search if no results
  if (totalResults === 0) {
    noResults = true;
    data =
      (await tryFallbackSearchV2(request, page, locale, limit, tenantId)) ??
      data;
    totalResults = extractTotalResults(data);
  }

  const hits = data?.search?.hits?.hits;
  const results = transformSearchHits(hits);
  const filters = extractFilters(data);

  return {
    results,
    noResults,
    totalResults,
    page,
    filters,
  };
}
