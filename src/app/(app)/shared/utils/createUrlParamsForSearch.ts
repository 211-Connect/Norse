import { ExtractAtomValue } from 'jotai';
import { SearchEngine } from '@/types/appConfig';

import { deriveQueryType } from '../lib/search-utils';
import { ResourceEntry } from '../lib/umami';
import { searchAtom } from '../store/search';

export function createUrlParamsForSearch(
  searchStore: ExtractAtomValue<typeof searchAtom>,
  searchEngine: SearchEngine,
) {
  const hasLocation = searchStore['searchCoordinates']?.length === 2;

  const queryType = deriveQueryType({
    query: searchStore.query,
    originQueryType: searchStore.queryType,
    searchEngine,
  });

  const urlParams = {
    query: searchStore.query?.trim(),
    query_label: searchStore.queryLabel?.trim(),
    query_type: queryType,
    location: hasLocation ? searchStore.searchLocation?.trim() : null,
    coords: hasLocation
      ? searchStore.searchCoordinates?.join(',')?.trim()
      : null,
    distance:
      searchStore.searchCoordinates?.length === 2
        ? searchStore.searchDistance?.trim() || '0'
        : '',
    entry: ResourceEntry.SearchCard,
  };

  return Object.fromEntries(
    Object.entries(urlParams).filter(
      ([_, value]) =>
        value != null && (typeof value !== 'string' || value.trim() !== ''),
    ),
  ) as Record<string, string>;
}
