import { useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { Autocomplete } from '../autocomplete';
import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import { searchAtom, searchTermAtom } from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useSuggestions } from '../../hooks/use-suggestions';

export function SearchBar() {
  const { t } = useTranslation();
  const setSearch = useSetAtom(searchAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    return [
      {
        group: t('search.suggestions'),
        items: suggestions
          .map((option) => ({ value: option.name }))
          .filter((option) =>
            option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
          ),
      },
      {
        group: t('search.taxonomies'),
        items: taxonomies.map((option) => ({
          value: option.name,
          label: option.code,
        })),
      },
    ];
  }, [taxonomies, suggestions, searchTerm, t]);

  // Find the taxonomy code to be used for a query
  // Fallback to the original string value if a code isn't found
  const findCode = (value: string) => {
    const taxonomy = taxonomies.find(
      (tax) => tax.name.toLowerCase() === value.toLowerCase(),
    );
    if (taxonomy) return taxonomy.code;

    const suggestion = suggestions.find(
      (sugg) => sugg.name.toLowerCase() === value.toLowerCase(),
    );
    if (suggestion) return suggestion.taxonomies;

    return value;
  };

  const getQueryType = (value, query) => {
    if (query.trim().length === 0) return '';
    if (query === value) return 'text';
    return 'taxonomy';
  };

  const setSearchTerm = (value: string) => {
    const query = findCode(value);
    const queryType = getQueryType(value, query);

    setSearch((prev) => ({
      ...prev,
      query,
      queryType,
      searchTerm: value,
      queryLabel: value,
    }));
  };

  return (
    <Autocomplete
      className="search-box"
      placeholder={
        t('search.query_placeholder', {
          ns: 'dynamic',
          defaultValue: t('search.query_placeholder'),
        }) || ''
      }
      options={options}
      onInputChange={setSearchTerm}
      value={searchTerm}
    />
  );
}
