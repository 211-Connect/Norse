import { ExtractAtomValue } from 'jotai';
import qs from 'qs';

import { TaxonomyService } from './taxonomy-service';
import { deriveQueryType } from '../lib/search-utils';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';
import { buildSearchRequest } from '../lib/search-utils';
import {
  FindResourcesResult,
  SearchResponseRoot,
  SearchHit,
  SearchResultItem,
  SearchStoreState,
} from '@/types/search';
import { Point } from 'geojson';

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

export async function findResources(
  query: Record<string, string>,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<FindResourcesResult> {
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  const pageStr = String(page);
  const limitStr = String(limit);

  let data: SearchResponseRoot | null = null;

  try {
    const searchParams = new URLSearchParams({
      ...query,
      page: pageStr,
      locale,
      limit: limitStr,
    });

    if (tenantId) {
      searchParams.append('tenant_id', tenantId);
    }

    data = await fetchWrapper<SearchResponseRoot>(
      `${API_URL}/search?${searchParams.toString()}`,
      {
        headers: {
          'accept-language': locale,
          'x-api-version': '1',
          ...(tenantId && { 'x-tenant-id': tenantId }),
        },
        cache: 'no-store',
      },
    );
  } catch (err) {
    console.error('Search API error:', {
      error: err,
      tenantId,
      query,
      page,
      locale,
      limit,
    });
    // Return early with empty results if API fails completely
    return {
      results: [],
      noResults: true,
      totalResults: 0,
      page: 1,
      filters: {},
    };
  }

  // If response succeeded but data is malformed, return empty results
  if (!data || !data.search) {
    console.error('Malformed API response:', {
      data,
      tenantId,
      query,
      page,
      locale,
      limit,
    });
    return {
      results: [],
      noResults: true,
      totalResults: 0,
      page: 1,
      filters: {},
    };
  }

  let totalResults =
    typeof data?.search?.hits?.total !== 'number'
      ? (data?.search?.hits?.total?.value ?? 0)
      : (data?.search?.hits?.total ?? 0);

  let noResults = false;
  if (totalResults === 0) {
    noResults = true;

    try {
      const fallbackParams = new URLSearchParams({
        ...query,
        page: pageStr,
        query_type: 'more_like_this',
        locale,
        limit: limitStr,
      });

      if (tenantId) {
        fallbackParams.append('tenant_id', tenantId);
      }

      const fallbackData = await fetchWrapper<SearchResponseRoot>(
        `${API_URL}/search?${fallbackParams.toString()}`,
        {
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
            ...(tenantId && { 'x-tenant-id': tenantId }),
          },
          cache: 'no-store',
        },
      );

      if (fallbackData?.search) {
        data = fallbackData;
      }
    } catch (err) {
      console.error('Fallback search API error:', {
        error: err,
        tenantId,
        query: { ...query, query_type: 'more_like_this' },
        page,
        locale,
        limit,
      });
    }

    totalResults =
      typeof data?.search?.hits?.total !== 'number'
        ? (data?.search?.hits?.total?.value ?? 0)
        : (data?.search?.hits?.total ?? 0);
  }

  const hits = data?.search?.hits?.hits;
  const facetDefinitions = data?.facets;

  const results = Array.isArray(hits)
    ? hits.map((hit: SearchHit) => {
        const source = hit._source;
        let mainAddress: string | null = null;

        // Check for physical address from nested location object
        const physicalAddress = source.location?.physical_address;
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

        const transformedFacets = transformFacetsToArray(
          source.facets,
          facetDefinitions,
          locale,
        );

        // Map nested properties to SearchResultItem
        const responseData: SearchResultItem = {
          _id: hit._id,
          id: source.service_at_location_id ?? null,
          priority: source.priority,
          serviceName: source.service?.name ?? null,
          name: source.name ?? null,
          summary: source.service?.summary ?? null,
          description:
            source.service?.description ?? source.description ?? null,
          phone: source.phone ?? null,
          website: source.url ?? null,
          address: mainAddress,
          location: (source.location?.point ?? null) as Point | null,
          taxonomies: source.taxonomies ?? null,
          facets: transformedFacets.length > 0 ? transformedFacets : null,
        };

        return Object.fromEntries(
          Object.entries(responseData).filter(([_, value]) => value != null),
        ) as SearchResultItem;
      })
    : [];

  const aggregations = data?.search?.aggregations ?? {};
  const filters = Object.keys(aggregations).reduce((acc, key) => {
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
  }, {});

  return {
    results,
    noResults,
    totalResults,
    page,
    filters,
  };
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
  searchStore: SearchStoreState,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<FindResourcesResult> {
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  const request = buildSearchRequest({
    ...searchStore,
    searchPlaceType: searchStore.searchPlaceType || [],
    searchBbox: searchStore.searchBbox || null,
  });

  // Build query params with pagination
  const queryParams = qs.stringify({
    ...request.queryParams,
    page,
    locale,
    limit,
  });

  const searchUrl = `${API_URL}/search?${queryParams}`;

  let data: SearchResponseRoot | null = null;

  try {
    data = await fetchWrapper<SearchResponseRoot>(searchUrl, {
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

    // Return early with empty results if API fails completely
    return {
      results: [],
      noResults: true,
      totalResults: 0,
      page: 1,
      filters: {},
    };
  }

  // If response succeeded but data is malformed, return empty results
  if (!data || !data.search) {
    console.error('Malformed API response (V2):', {
      data,
      url: searchUrl,
      tenantId,
      page,
      locale,
      limit,
    });
    return {
      results: [],
      noResults: true,
      totalResults: 0,
      page: 1,
      filters: {},
    };
  }

  let totalResults = 0;
  if (typeof data?.search?.hits?.total === 'number') {
    totalResults = data.search.hits.total;
  } else if (typeof data?.search?.hits?.total === 'object') {
    totalResults = data.search.hits.total.value ?? 0;
  }

  let noResults = false;
  if (totalResults === 0) {
    noResults = true;

    // Try fallback search with more_like_this
    const fallbackQueryParams = qs.stringify({
      ...request.queryParams,
      page,
      query_type: 'more_like_this',
      locale,
      limit,
    });
    const fallbackUrl = `${API_URL}/search?${fallbackQueryParams}`;

    try {
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

      if (fallbackData?.search) {
        data = fallbackData;
      }
    } catch (err) {
      console.error('Fallback search API error (V2):', {
        error: err,
        url: fallbackUrl,
        tenantId,
      });
    }

    if (typeof data?.search?.hits?.total === 'number') {
      totalResults = data.search.hits.total;
    } else if (typeof data?.search?.hits?.total === 'object') {
      totalResults = data.search.hits.total.value ?? 0;
    }
  }

  const hits = data?.search?.hits?.hits;
  const results = Array.isArray(hits)
    ? hits.map((hit: SearchHit) => {
        const source = hit._source;
        let mainAddress: string | null = null;

        const physicalAddress = source.location?.physical_address;
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

        const responseData: SearchResultItem = {
          _id: hit._id,
          id: source.service_at_location_id ?? null,
          priority: source.priority,
          serviceName: source.service?.name ?? null,
          name: source.name ?? source.organization?.name ?? null,
          summary: source.service?.summary ?? null,
          description:
            source.service?.description ?? source.description ?? null,
          phone: source.phone ?? null,
          website: source.url ?? null,
          address: mainAddress,
          location: (source.location?.point ?? null) as Point | null,
          taxonomies: source.taxonomies ?? null,
          facets: null,
        };

        return Object.fromEntries(
          Object.entries(responseData).filter(([_, value]) => value != null),
        ) as SearchResultItem;
      })
    : [];
    
  return {
    results,
    noResults,
    totalResults,
    page,
    filters: data?.search?.aggregations ?? {},
  };
}
