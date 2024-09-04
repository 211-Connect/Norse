import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import axios from 'axios';
import { API_URL, TENANT_ID } from '../lib/constants';
import qs from 'qs';
import _ from 'lodash';

export class SearchService {
  static endpoint = 'search';

  static createUrlParamsForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
  ) {
    const urlParams = {
      query: searchStore['query']?.trim(),
      query_label: searchStore['queryLabel']?.trim(),
      query_type: searchStore['queryType']?.trim(),
      location: searchStore['userLocation']?.trim(),
      coords: searchStore['userCoordinates']?.join(',')?.trim(),
      distance:
        searchStore['userCoordinates']?.length === 2
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
    if (isNaN(page)) {
      page = 1;
    }

    if (isNaN(limit)) {
      limit = 25;
    }

    let response;
    try {
      response = await axios.get(
        `${API_URL}/search?${qs.stringify({
          ...query,
          page,
          locale,
          tenant_id: TENANT_ID,
          limit,
        })}`,
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
        data = await axios.get(
          `${API_URL}/search?${qs.stringify({
            ...query,
            page,
            query_type: 'more_like_this',
            locale,
            tenant_id: TENANT_ID,
            limit,
          })}`,
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
          let mainAddress: string | null =
            `${hit._source.address_1}, ${hit._source.city}, ${hit._source.state}, ${hit._source.postal_code}`;

          if (mainAddress.includes('null')) {
            mainAddress = null;
          }

          const responseData = {
            _id: hit._id,
            id: hit?._source?.service_at_location_id ?? null,
            priority: hit?._source?.priority,
            serviceName: hit?._source?.service_name ?? null,
            name: hit?._source?.display_name ?? null,
            description:
              hit?._source?.short_service_description ??
              hit?._source?.service_description ??
              null,
            phone: hit?._source?.primary_phone ?? null,
            website: hit?._source?.primary_website ?? null,
            address: mainAddress,
            location: hit?._source?.location ?? null,
            taxonomyTerms: hit?._source?.taxonomy_terms ?? null,
            taxonomyCodes: hit?._source?.taxonomy_codes ?? null,
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
