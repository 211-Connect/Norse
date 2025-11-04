import { useCallback, useMemo } from 'react';
import { useDebounce } from './use-debounce';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCategories } from './use-categories';
import { useSuggestions } from './use-suggestions';
import { useTaxonomies } from './api/use-taxonomies';
import { searchAtom, searchLocationAtom } from '../store/search';
import { useLocations } from './api/use-locations';

export const useSearchResources = (searchTerm: string = '') => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);

  const debouncedSearchTerm = useDebounce(search.searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();
  const categories = useCategories();

  const searchLocation = useAtomValue(searchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
  const { data: locations } = useLocations(debouncedSearchLocation);

  const reducedCategories: {
    name: string;
    query: string;
    queryType: string;
  }[] = useMemo(() => {
    if (searchTerm.length === 0) return [];

    return categories
      .reduce((prev, current) => {
        if (current?.subcategories?.length > 0) {
          return prev.concat(current.subcategories);
        }

        return prev;
      }, [])
      .filter(({ name }) =>
        name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [categories, searchTerm]);

  const findCode = useCallback(
    (value: string) => {
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return taxonomy.code;

      const suggestion = suggestions.find(
        (sugg) => sugg?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (suggestion) return suggestion.taxonomies;

      const category = reducedCategories.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) return category.query;

      return value;
    },
    [reducedCategories, suggestions, taxonomies],
  );

  const getQueryType = useCallback(
    (value, query) => {
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return 'taxonomy';

      const suggestion = suggestions.find(
        (sugg) => sugg?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (suggestion) return 'taxonomy';

      const category = reducedCategories.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) return 'taxonomy';

      if (query.trim().length === 0) return '';
      if (query === value) return 'text';
      return 'taxonomy';
    },
    [reducedCategories, suggestions, taxonomies],
  );

  return {
    findCode,
    getQueryType,
    locations,
    reducedCategories,
    search,
    setSearch,
    suggestions,
  };
};
