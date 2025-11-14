import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import qs from 'qs';
import _ from 'lodash';
import { Axios } from '../lib/axios';
import { TaxonomyService } from './taxonomy-service';
import { HybridSemanticSearchService } from './hybrid-semantic-search-service';
import { QueryType, determineQueryType } from '../constants/query-types';

export class SearchService {
  static endpoint = 'search';

  static createUrlParamsForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
  ) {
    const hasLocation = searchStore['searchCoordinates']?.length === 2;

    const isTaxonomyCode = TaxonomyService.isTaxonomyCode(
      searchStore['query']?.trim(),
    );

    const queryType = determineQueryType(
      isTaxonomyCode,
      searchStore['queryType']?.trim(),
    );

    const urlParams = {
      query: searchStore['query']?.trim(),
      query_label: searchStore['queryLabel']?.trim(),
      query_type: queryType,
      location: hasLocation ? searchStore['searchLocation']?.trim() : null,
      coords: hasLocation
        ? searchStore['searchCoordinates']?.join(',')?.trim()
        : null,
      distance:
        searchStore['searchCoordinates']?.length === 2
          ? searchStore['searchDistance']?.trim() || '0'
          : '',
    };

    return omitBy(
      urlParams,
      (value) => isNil(value) || (isString(value) && isEmpty(value.trim())),
    );
  }

  static async findResources(
    query: any,
    { locale, page, limit }: { locale: string; page: number; limit?: number },
  ) {
    // Check if hybrid semantic search is enabled via environment variable
    const useHybridSemanticSearch =
      process.env.NEXT_PUBLIC_USE_HYBRID_SEMANTIC_SEARCH === 'true';

    console.log('useHybridSemanticSearch:', useHybridSemanticSearch);
    console.log('Search query type:', query.query_type);

    // Use hybrid semantic search for text queries if enabled
    if (useHybridSemanticSearch && query.query_type === QueryType.TEXT) {
      return HybridSemanticSearchService.findResources(query, {
        locale,
        page,
        limit,
      });
    }

    // Continue with legacy search implementation
    if (isNaN(page)) {
      page = 1;
    }

    if (isNaN(limit)) {
      limit = 25;
    }

    let response;
    try {
      response = await Axios.get(
        `${API_URL}/search?${qs.stringify({
          ...query,
          page,
          locale,
          limit,
        })}`,
        {
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
          },
        },
      );
    } catch (err) {}

    let data = response?.data;

    let totalResults =
      typeof data?.search?.hits?.total !== 'number'
        ? (data?.search?.hits?.total?.value ?? 0)
        : (data?.search?.hits?.total ?? 0);

    let noResults = false;
    if (totalResults === 0) {
      noResults = true;
      try {
        data = await Axios.get(
          `${API_URL}/search?${qs.stringify({
            ...query,
            page,
            query_type: QueryType.MORE_LIKE_THIS,
            locale,
            limit,
          })}`,
          {
            headers: {
              'accept-language': locale,
              'x-api-version': '1',
            },
          },
        );
      } catch (err) {}

      totalResults =
        typeof data?.search?.hits?.total !== 'number'
          ? (data?.search?.hit?.total?.value ?? 0)
          : (data?.search?.hits?.total ?? 0);
    }

    return {
      results:
        data?.search?.hits?.hits?.map((hit: any) => {
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

          return _.omitBy(responseData, _.isNil);
        }) ?? [],
      noResults,
      totalResults,
      page,
      filters: data?.search?.aggregations ?? {},
    };
  }
}
