import { ExtractAtomValue } from 'jotai';
import qs from 'qs';

import { TaxonomyService } from './taxonomy-service';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import { createAxios } from '../lib/axios';

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

  const axios = createAxios(tenantId);

  const searchUrl = `${API_URL}/search?${qs.stringify({
    ...query,
    page,
    locale,
    limit,
  })}`;

  let response;
  try {
    response = await axios.get(searchUrl, {
      headers: {
        'accept-language': locale,
        'x-api-version': '1',
      },
    });
  } catch (err) {
    console.error('Search API error:', {
      error: err,
      url: searchUrl,
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

  let data = response?.data;

  // If response succeeded but data is malformed, return empty results
  if (!data || !data.search) {
    console.error('Malformed API response:', {
      data,
      url: searchUrl,
      tenantId,
      query,
      page,
      locale,
      limit,
      statusCode: response?.status,
      headers: response?.headers,
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
    const fallbackUrl = `${API_URL}/search?${qs.stringify({
      ...query,
      page,
      query_type: 'more_like_this',
      locale,
      limit,
    })}`;

    try {
      const fallbackResponse = await axios.get(fallbackUrl, {
        headers: {
          'accept-language': locale,
          'x-api-version': '1',
        },
      });

      if (fallbackResponse?.data?.search) {
        data = fallbackResponse.data;
      }
    } catch (err) {
      console.error('Fallback search API error:', {
        error: err,
        url: fallbackUrl,
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
