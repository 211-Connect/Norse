import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import _ from 'lodash';
import { Axios } from '../lib/axios';

/**
 * Hybrid Semantic Search Service
 * Uses the new /hybrid-semantic/search API endpoint with POST method
 */
export class HybridSemanticSearchService {
  static endpoint = 'hybrid-semantic/search';

  /**
   * Convert search store params to hybrid semantic search request body
   */
  static createRequestBodyForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
    locale: string,
    page: number,
    limit: number,
  ) {
    const hasLocation = searchStore['searchCoordinates']?.length === 2;

    const requestBody: any = {
      q: searchStore['query']?.trim(),
      lang: locale,
      limit: limit,
      legacy_offset_pagination: true, // Use normal pagination for compatibility
      page: page,
    };

    // Add location parameters if available
    if (hasLocation && searchStore['searchCoordinates']) {
      const [lat, lon] = searchStore['searchCoordinates'];
      requestBody.lat = lat;
      requestBody.lon = lon;
    }

    // Add distance if location is provided
    if (hasLocation && searchStore['searchDistance']) {
      const distance = parseInt(searchStore['searchDistance'], 10);
      if (!isNaN(distance) && distance > 0) {
        requestBody.distance = distance;
      }
    }

    // Remove null/undefined values
    return omitBy(
      requestBody,
      (value) => isNil(value) || (isString(value) && isEmpty(value.trim())),
    );
  }

  /**
   * Execute hybrid semantic search
   */
  static async findResources(
    query: any,
    { locale, page, limit }: { locale: string; page: number; limit?: number },
  ) {
    if (isNaN(page)) {
      page = 1;
    }

    if (isNaN(limit)) {
      limit = 25;
    }

    // Build request body based on search parameters
    const requestBody: any = {
      q: query.query?.trim(),
      lang: locale,
      limit: limit,
      legacy_offset_pagination: true,
      page: page,
    };

    // Parse coordinates if provided
    if (query.coords) {
      const coords = query.coords
        .split(',')
        .map((c: string) => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        requestBody.lat = coords[0];
        requestBody.lon = coords[1];
      }
    }

    // Add distance if provided
    if (query.distance) {
      const distance = parseInt(query.distance, 10);
      if (!isNaN(distance) && distance > 0) {
        requestBody.distance = distance;
      }
    }

    let response;
    try {
      response = await Axios.post(
        `${API_URL}/${this.endpoint}`,
        omitBy(
          requestBody,
          (value) => isNil(value) || (isString(value) && isEmpty(value.trim())),
        ),
        {
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
            'x-tenant-id': process.env.NEXT_PUBLIC_TENANT_ID || '',
          },
        },
      );
    } catch (err) {
      console.error('Hybrid semantic search failed:', err);
      throw err;
    }

    const data = response?.data;
    const totalResults = data?.total_results ?? 0;

    // Extract pagination metadata from top-level response properties
    const currentPage = data?.page ?? page;
    const totalPages = data?.total_pages ?? 1;
    const hasNextPage = data?.has_next_page ?? false;
    const hasPreviousPage = data?.has_previous_page ?? false;

    // Check if no results
    const noResults = totalResults === 0;

    return {
      results:
        data?.hits?.hits?.map((hit: any) => {
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

          // Extract and format location to match map expectations
          let location = null;
          const point = hit._source?.location?.point;
          if (point) {
            // Map expects { coordinates: [lon, lat] } format
            if (point.lat !== undefined && point.lon !== undefined) {
              location = {
                coordinates: [point.lon, point.lat],
              };
            }
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
            location: location,
            taxonomies: hit?._source?.taxonomies ?? null,
            distance_from_user: hit?._source?.distance_from_user ?? null,
          };

          return _.omitBy(responseData, _.isNil);
        }) ?? [],
      noResults,
      totalResults,
      page: currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      filters: {}, // Hybrid semantic search doesn't return aggregations yet
      metadata: data?.metadata,
    };
  }
}
