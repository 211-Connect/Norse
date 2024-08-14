import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';

export class SearchService {
  static endpoint = 'search';

  static createUrlParamsForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
  ) {
    const urlParams = {
      query: searchStore['query'].trim(),
      query_label: searchStore['queryLabel'].trim(),
      query_type: searchStore['queryType'].trim(),
      location: searchStore['userLocation'].trim(),
      coords: searchStore['userCoordinates'].join(',').trim(),
      distance:
        searchStore['userCoordinates'].length === 2
          ? searchStore['searchDistance'].trim() || 0
          : '',
    };

    return omitBy(
      urlParams,
      (value) => isNil(value) || (isString(value) && isEmpty(value.trim())),
    );
  }

  static async findResources(searchTerm: string, options: { locale: string }) {}
}
