import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import { API_URL } from '../lib/constants';
import qs from 'qs';
import _ from 'lodash';
import { Axios } from '../lib/axios';
import { TaxonomyService } from './taxonomy-service';

export class SearchService {
  static endpoint = 'search';

  static createUrlParamsForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
  ) {
    const hasLocation = searchStore['searchCoordinates']?.length === 2;

    const isTaxonomyCode = TaxonomyService.isTaxonomyCode(
      searchStore['query']?.trim(),
    );

    const urlParams = {
      query: searchStore['query']?.trim(),
      query_label: searchStore['queryLabel']?.trim(),
      query_type: isTaxonomyCode
        ? 'taxonomy'
        : searchStore['queryType']?.trim(),
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
            query_type: 'more_like_this',
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
          let mainAddress: string | null =
            `${hit._source?.location?.physical_address?.address_1}, ${hit._source?.location?.physical_address?.city}, ${hit._source?.location?.physical_address?.state}, ${hit._source?.location?.physical_address?.postal_code}`;

          if (
            mainAddress.includes('null') ||
            mainAddress.includes('undefined')
          ) {
            mainAddress = null;
          }

          const responseData = {
            _id: hit._id,
            id: hit?._source?.service_at_location_id ?? null,
            priority: hit?._source?.priority,
            serviceName: hit?._source?.service?.name ?? null,
            name: hit?._source?.name ?? null,
            description:
              hit?._source?.service?.summary ??
              hit?._source?.service?.description ??
              null,
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
