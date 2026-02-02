import { Point } from 'geojson';
import qs from 'qs';
import {
  SearchResponseRoot,
  FindResourcesResult,
  PhysicalAddressDto,
  SearchHit,
  SearchResultItem,
} from '@/types/search';
import { transformFacetsToArray } from './toFacetsWithTranslation';

/**
 * Extract total results count from Elasticsearch API response.
 * Handles both number and object formats for the total field.
 *
 * @param data - Search API response
 * @returns Total count of results, or 0 if not available
 */
export function extractTotalResults(data: SearchResponseRoot | null): number {
  if (!data?.search?.hits?.total) return 0;

  return typeof data.search.hits.total === 'number'
    ? data.search.hits.total
    : (data.search.hits.total.value ?? 0);
}

/**
 * Create an empty search result object for error cases or when no results are found.
 *
 * @returns Empty search result with default values
 */
export function createEmptySearchResult(): FindResourcesResult {
  return {
    results: [],
    noResults: true,
    totalResults: 0,
    page: 1,
    filters: {},
  };
}

/**
 * Build a formatted address string from a physical address object.
 * Requires address_1, city, state, and postal_code to be present.
 *
 * @param physicalAddress - Physical address object from API
 * @returns Formatted address string or null if incomplete
 */
export function buildAddressFromPhysical(
  physicalAddress: PhysicalAddressDto | null | undefined,
): string | null {
  if (
    !physicalAddress ||
    !physicalAddress.address_1 ||
    !physicalAddress.city ||
    !physicalAddress.state ||
    !physicalAddress.postal_code
  ) {
    return null;
  }

  const addressParts = [
    physicalAddress.address_1,
    physicalAddress.address_2,
    physicalAddress.city,
    physicalAddress.state,
    physicalAddress.postal_code,
  ].filter((part) => part && part.trim());

  return addressParts.join(', ');
}

/**
 * Create headers for search API requests.
 * Standardizes header creation for both GET and POST requests.
 *
 * @param locale - Current locale (e.g., 'en-US')
 * @param tenantId - Optional tenant ID
 * @param isJson - Whether to include Content-Type: application/json (for POST)
 * @returns Headers object
 */
export function createSearchHeaders(
  locale: string,
  tenantId?: string,
  isJson: boolean = false,
): Record<string, string> {
  const headers: Record<string, string> = {
    'accept-language': locale,
    'x-api-version': '1',
  };

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Transform a raw generic SearchHit into a UI-ready SearchResultItem.
 * Handles duplicate logic for mapping fields, addressing, and facet transformation.
 *
 * @param hit - Raw search hit from Elasticsearch
 * @param locale - Current locale
 * @param facetDefinitions - Optional definitions for facet translation
 * @returns Transformed SearchResultItem
 */
export function transformSearchHit(
  hit: SearchHit,
  locale: string,
  facetDefinitions?: Record<string, any>,
): SearchResultItem {
  const source = hit._source;
  const mainAddress = buildAddressFromPhysical(
    source.location?.physical_address,
  );

  const transformedFacets = transformFacetsToArray(
    source.facets,
    facetDefinitions,
    locale,
  );

  // Map nested properties to SearchResultItem
  // Note: Using source.organization?.name as fallback for name differs slightly from V1 but aligns with V2
  const responseData: SearchResultItem = {
    _id: hit._id,
    id: source.service_at_location_id ?? null,
    priority: source.priority,
    serviceName: source.service?.name ?? null,
    name: source.name ?? source.organization?.name ?? null,
    summary: source.service?.summary ?? null,
    description: source.service?.description ?? source.description ?? null,
    phone: source.phone ?? null,
    website: source.url ?? null,
    address: mainAddress,
    location: (source.location?.point ?? null) as Point | null,
    taxonomies: source.taxonomies ?? null,
    facets: transformedFacets.length > 0 ? transformedFacets : null,
  };

  // Filter out null/undefined values to keep payload clean
  return Object.fromEntries(
    Object.entries(responseData).filter(([_, value]) => value != null),
  ) as SearchResultItem;
}

/**
 * Execute a fallback search (e.g., 'more_like_this') when initial search yields no results.
 *
 * @param fetchFn - Fetch function (dependency injection for testability)
 * @param baseUrl - Base API URL
 * @param queryParams - Base query parameters
 * @param locale - Current locale
 * @param page - Page number
 * @param limit - Results limit
 * @param tenantId - Optional tenant ID
 * @param method - HTTP method (GET or POST)
 * @param body - Request body for POST requests
 * @returns Fallback search results or null if failed
 */
export async function executeFallbackSearch(
  fetchFn: <T>(url: string, config: any) => Promise<T | null>,
  baseUrl: string,
  queryParams: Record<string, any>,
  locale: string,
  page: number | string,
  limit: number | string,
  tenantId?: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
): Promise<SearchResponseRoot | null> {
  const fallbackParams = qs.stringify({
    ...queryParams,
    page,
    limit,
    query_type: 'more_like_this',
    locale,
  });

  const fallbackUrl = `${baseUrl}?${fallbackParams}`;
  const isJson = method === 'POST';

  try {
    const data = await fetchFn<SearchResponseRoot>(fallbackUrl, {
      method,
      headers: createSearchHeaders(locale, tenantId, isJson),
      ...(body ? { body } : {}),
    });

    return data;
  } catch (err) {
    console.error(
      `Fallback search API error (${method === 'POST' ? 'V2' : 'V1'}):`,
      {
        error: err,
        url: fallbackUrl,
        tenantId,
        method,
      },
    );
    return null;
  }
}

/**
 * Execute a complete search workflow including fallback and transformation.
 *
 * @param fetchFn - Fetch function (dependency injection)
 * @param baseUrl - Base API URL
 * @param primaryQueryParams - Query parameters for the initial search
 * @param locale - Current locale
 * @param page - Page number
 * @param limit - Results limit
 * @param tenantId - Optional tenant ID
 * @param method - HTTP method for primary search
 * @param body - Request body for primary search (POST only)
 * @param fallbackQueryParams - Query parameters for fallback search (defaults to primaryQueryParams)
 * @returns Complete search result
 */
export async function executeSearch(
  fetchFn: <T>(url: string, config: any) => Promise<T | null>,
  baseUrl: string,
  primaryQueryParams: Record<string, any>,
  locale: string,
  page: number,
  limit: number,
  tenantId?: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  fallbackQueryParams?: Record<string, any>,
): Promise<FindResourcesResult> {
  const searchUrl = `${baseUrl}?${qs.stringify(primaryQueryParams)}`;
  const isJson = method === 'POST';

  let data: SearchResponseRoot | null = null;

  try {
    data = await fetchFn<SearchResponseRoot>(searchUrl, {
      method,
      headers: createSearchHeaders(locale, tenantId, isJson),
      ...(body ? { body } : {}),
      cache: 'no-store',
    });
  } catch (err) {
    console.error(`Search API error (${method === 'POST' ? 'V2' : 'V1'}):`, {
      error: err,
      url: searchUrl,
      tenantId,
      method,
      queryParams: primaryQueryParams,
    });
    return createEmptySearchResult();
  }

  // Handle malformed response
  if (!data || !data.search) {
    console.error(
      `Malformed API response (${method === 'POST' ? 'V2' : 'V1'}):`,
      {
        data,
        url: searchUrl,
        tenantId,
      },
    );
    return createEmptySearchResult();
  }

  let totalResults = extractTotalResults(data);
  let noResults = false;

  // Execute fallback if no results
  if (totalResults === 0) {
    noResults = true;
    const fallbackData = await executeFallbackSearch(
      fetchFn,
      baseUrl.split('?')[0], // Ensure clean base URL
      fallbackQueryParams || primaryQueryParams,
      locale,
      page,
      limit,
      tenantId,
      method, // Reuse method context for fallback usually
      body, // Reuse body for POST fallback
    );

    if (fallbackData?.search) {
      data = fallbackData;
      totalResults = extractTotalResults(data);
    }
  }

  const hits = data?.search?.hits?.hits;
  const facetDefinitions = data?.facets;

  const results = Array.isArray(hits)
    ? hits.map((hit: SearchHit) =>
        transformSearchHit(hit, locale, facetDefinitions),
      )
    : [];

  return {
    results,
    noResults,
    totalResults,
    page,
    filters: data?.search?.aggregations ?? {},
  };
}
import { deriveQueryType } from '../lib/search-utils';
import { SearchStoreState } from '@/types/search';

/**
 * Creates a URL parameters object from the search store state.
 * Filters out null/undefined/empty values.
 *
 * @param searchStore - Current search store state
 * @returns Record of URL parameters
 */
export function createUrlParamsForSearch(searchStore: SearchStoreState) {
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
