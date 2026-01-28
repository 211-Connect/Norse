import { ExtractAtomValue } from 'jotai';

import { TaxonomyService } from './taxonomy-service';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { transformFacetsToArray } from '../utils/toFacetsWithTranslation';

export function createUrlParamsForSearch(
  searchStore: ExtractAtomValue<typeof searchAtom>,
) {
  const hasLocation = searchStore['searchCoordinates']?.length === 2;

  const isTaxonomyCode = TaxonomyService.isTaxonomyCode(
    searchStore['query']?.trim(),
  );

  const urlParams = {
    query: searchStore['query']?.trim(),
    query_label: searchStore['queryLabel']?.trim(),
    query_type: isTaxonomyCode ? 'taxonomy' : searchStore['queryType']?.trim(),
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
