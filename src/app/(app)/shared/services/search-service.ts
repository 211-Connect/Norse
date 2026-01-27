import { ExtractAtomValue } from 'jotai';

import { TaxonomyService } from './taxonomy-service';
import { deriveQueryType } from '../lib/search-utils';
import { searchAtom } from '../store/search';
import { API_URL, INTERNAL_API_KEY } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';

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

export async function findResources(
  query: any,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
) {
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  let data;
  let responseStatusCode;
  let responseHeaders;
  try {
    const searchParams = new URLSearchParams({
      ...query,
      page: String(page),
      locale,
      limit,
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
      statusCode: responseStatusCode,
      headers: responseHeaders,
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
        ? (data?.search?.hit?.total?.value ?? 0)
        : (data?.search?.hits?.total ?? 0);
  }

  const hits = data?.search?.hits?.hits;
  const facetDefinitions = data?.facets;

  const results = Array.isArray(hits)
    ? hits.map((hit: any) => {
        const physicalAddress = hit._source?.location?.physical_address;
        let mainAddress: string | null = null;

        if (
          physicalAddress?.address_1 &&
          physicalAddress?.city &&
          physicalAddress?.state &&
          physicalAddress?.postal_code
        ) {
          // Construct address similar to information.tsx format
          const addressParts = [
            physicalAddress.address_1,
            physicalAddress.address_2 ? physicalAddress.address_2 : null,
            physicalAddress.city,
            physicalAddress.state,
            physicalAddress.postal_code,
          ].filter(Boolean); // Remove null/undefined values

          mainAddress = addressParts.join(', ');
        }

        const transformedFacets = transformFacetsToArray(
          hit?._source?.facets,
          facetDefinitions,
          locale,
        );

        const responseData = {
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
          facets: transformedFacets.length > 0 ? transformedFacets : null,
        };

        return Object.fromEntries(
          Object.entries(responseData).filter(([_, value]) => value != null),
        );
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
  searchStore: any, // From searchAtom
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
) {
  console.log('findResourceV2 was called');
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  // Build request using decision logic from geo-search-utils
  const { buildSearchRequest } = await import('../lib/search-utils');
  
  const request = buildSearchRequest({
    ...searchStore,
    queryType: deriveQueryType(searchStore['query'], searchStore['queryType']) || '',
  });

  // Build query params with pagination
  const queryParams = qs.stringify({
    ...request.queryParams,
    page,
    locale,
    limit,
  });

  const searchUrl = `${API_URL}/search?${queryParams}`;

  let response;

  try {
    response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': locale,
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      body: JSON.stringify(request.body),
    });

    if (!response.ok) {
      // enhanced error handling
      const errorText = await response.text();
      console.error('Search API Failed Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
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

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error('Failed to parse search response:', {
      error: err,
      url: searchUrl,
      status: response.status,
    });
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
      statusCode: response.status,
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
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': locale,
          'x-api-version': '1',
          ...(tenantId && { 'x-tenant-id': tenantId }),
        },
        body: JSON.stringify(request.body),
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData?.search) {
          data = fallbackData;
        }
      }
    } catch (err) {
      console.error('Fallback search API error (V2):', {
        error: err,
        url: fallbackUrl,
        tenantId,
      });
    }

    totalResults =
      typeof data?.search?.hits?.total !== 'number'
        ? (data?.search?.hits?.total?.value ?? 0)
        : (data?.search?.hits?.total ?? 0);
  }

  const hits = data?.search?.hits?.hits;
  const results = Array.isArray(hits)
    ? hits.map((hit: any) => {
        const physicalAddress = hit._source?.location?.physical_address;
        let mainAddress: string | null = null;

        if (
          physicalAddress?.address_1 &&
          physicalAddress?.city &&
          physicalAddress?.state &&
          physicalAddress?.postal_code
        ) {
          // Construct address similar to information.tsx format
          const addressParts = [
            physicalAddress.address_1,
            physicalAddress.address_2 ? physicalAddress.address_2 : null,
            physicalAddress.city,
            physicalAddress.state,
            physicalAddress.postal_code,
          ].filter(Boolean); // Remove null/undefined values

          mainAddress = addressParts.join(', ');
        }

        const responseData = {
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

        return Object.fromEntries(
          Object.entries(responseData).filter(([_, value]) => value != null),
        );
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
