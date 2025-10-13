'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { SearchIcon } from 'lucide-react';

import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import { prevSearchTermAtom, searchTermAtom } from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { Autocomplete } from '../ui/autocomplete';
import { useFlag } from '../../hooks/use-flag';
import { useSearchResources } from '../../hooks/use-search-resources';

interface SearchBarProps {
  focusByDefault?: boolean;
}

export function SearchBar({ focusByDefault = false }: SearchBarProps) {
  const { t } = useTranslation('common');
  const [shouldSearch, setShouldSearch] = useState(false);
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(
    shouldSearch ? debouncedSearchTerm : prevSearchTerm,
  );
  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');

  const { reducedCategories, findCode, getQueryType, setSearch, suggestions } =
    useSearchResources(shouldSearch ? debouncedSearchTerm : prevSearchTerm);

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    return [
      ...suggestions
        .map((option) => ({
          Icon: SearchIcon,
          value: option.name,
          group: t('search.suggestions'),
        }))
        .filter((option, index) => {
          if (searchTerm.length !== 0 && index > 5) return false;

          return shouldSearch
            ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
            : option?.value
                ?.toLowerCase()
                ?.includes(prevSearchTerm?.toLowerCase());
        }),
      ...reducedCategories
        .map((option) => ({
          Icon: SearchIcon,
          group: t('search.categories'),
          value: option.name,
        }))
        .filter((option, index) => {
          if (index > 5) return false;

          return shouldSearch
            ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
            : option?.value
                ?.toLowerCase()
                ?.includes(prevSearchTerm?.toLowerCase());
        }),
      ...taxonomies
        .map((option) => ({
          group: t('search.taxonomies'),
          value: option.name,
          label: showTaxonomyBadge ? option.code : null,
        }))
        .slice(0, 5),
    ];
  }, [
    suggestions,
    reducedCategories,
    taxonomies,
    t,
    shouldSearch,
    searchTerm,
    prevSearchTerm,
    showTaxonomyBadge,
  ]);

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
        autoFocus: focusByDefault,
        placeholder:
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || '',
      }}
      defaultOpen={focusByDefault}
      options={options}
      onInputChange={handleInputChange}
      onValueChange={setSearchTerm}
      optionsPopoverClassName="mt-[110px] max-h-[calc(100vh-360px)]"
      value={searchTerm}
    />
  );
}
