import axios from 'axios';
import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import { API_URL, TENANT_ID } from '../lib/constants';

export class SearchService {
  static endpoint = 'search';

  static createUrlParamsForSearch(
    searchStore: ExtractAtomValue<typeof searchAtom>,
  ) {
    const urlParams = {
      query: searchStore['query'],
      query_label: searchStore['queryLabel'],
      query_type: searchStore['queryType'],
    };

    return omitBy(
      urlParams,
      (value) => isNil(value) || (isString(value) && isEmpty(value.trim())),
    );
  }

  static async findResources(searchTerm: string, options: { locale: string }) {}
}
