'use client';

import { useAtomValue, useSetAtom } from 'jotai';

import { useDebounce } from './use-debounce';
import { useTaxonomies } from './api/use-taxonomies';
import { searchAtom } from '../store/search';
import { SEARCH_DEBOUNCE_DELAY } from '../lib/constants';

export const useSearchResources = () => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);

  const debouncedSearchTerm = useDebounce(
    search.searchTerm,
    SEARCH_DEBOUNCE_DELAY,
  );
  const { displayData: displayTaxonomies } = useTaxonomies(debouncedSearchTerm);

  return {
    search,
    setSearch,
    displayTaxonomies,
  };
};
