import { useCallback, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import {
  prevSearchTermAtom,
  searchAtom,
  searchTermAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useSuggestions } from '../../hooks/use-suggestions';
import { useCategories } from '@/shared/hooks/use-categories';
import { Autocomplete } from '../ui/autocomplete';

export function SearchBar() {
  const { t } = useTranslation();
  const [shouldSearch, setShouldSearch] = useState(false);
  const setSearch = useSetAtom(searchAtom);
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(
    shouldSearch ? debouncedSearchTerm : prevSearchTerm,
  );
  const suggestions = useSuggestions();
  const categories = useCategories();

  const reducedCategories: {
    name: string;
    query: string;
    queryType: string;
  }[] = useMemo(() => {
    return categories.reduce((prev, current) => {
      if (current?.subcategories?.length > 0) {
        return prev.concat(current.subcategories);
      }

      return prev;
    }, []);
  }, [categories]);

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    return [
      ...suggestions
        .map((option) => ({
          value: option.name,
          label: t('search.suggestion'),
        }))
        .filter((option) =>
          shouldSearch
            ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
            : option?.value
                ?.toLowerCase()
                ?.includes(prevSearchTerm?.toLowerCase()),
        ),
      ...taxonomies.map((option) => ({
        value: option.name,
        label: t('search.service'),
      })),
    ];
  }, [taxonomies, suggestions, searchTerm, t, shouldSearch, prevSearchTerm]);

  // Find the taxonomy code to be used for a query
  // Fallback to the original string value if a code isn't found
  const findCode = useCallback(
    (value: string) => {
      const taxonomy = taxonomies.find(
        (tax) => tax.name.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return taxonomy.code;

      const suggestion = suggestions.find(
        (sugg) => sugg.name.toLowerCase() === value.toLowerCase(),
      );
      if (suggestion) return suggestion.taxonomies;

      const category = reducedCategories.find(
        (cat) => cat.name.toLowerCase() === value.toLowerCase(),
      );
      if (category) return category.query;

      return value;
    },
    [reducedCategories, suggestions, taxonomies],
  );

  const getQueryType = useCallback((value, query) => {
    if (query.trim().length === 0) return '';
    if (query === value) return 'text';
    return 'taxonomy';
  }, []);

  const setSearchTerm = useCallback(
    (value: string) => {
      const query = findCode(value);
      const queryType = getQueryType(value, query);

      setShouldSearch(false);

      setSearch((prev) => ({
        ...prev,
        query,
        queryType,
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [findCode, getQueryType, setSearch],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setShouldSearch(true);
      setSearch((prev) => ({
        ...prev,
        prevSearchTerm: value,
      }));
    },
    [setSearch],
  );

  return (
    <Autocomplete
      className="search-box"
      inputProps={{
        placeholder:
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || '',
      }}
      options={options}
      onInputChange={handleInputChange}
      onValueChange={setSearchTerm}
      value={searchTerm}
    />
  );
}
