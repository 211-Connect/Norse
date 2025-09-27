import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import {
  prevSearchTermAtom,
  searchAtom,
  searchTermAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useFlag } from '@/shared/hooks/use-flag';
import { Autocomplete } from '../ui/autocomplete';
import { useSearchResources } from '@/shared/hooks/use-search-resources';
import { SearchIcon } from 'lucide-react';

export function SearchBar() {
  const { t } = useTranslation();
  const [shouldSearch, setShouldSearch] = useState(false);
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(
    shouldSearch ? debouncedSearchTerm : prevSearchTerm,
  );
  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');

  const { reducedCategories, findCode, getQueryType, setSearch, suggestions } =
    useSearchResources();

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    return [
      ...suggestions
        .map((option) => ({
          Icon: SearchIcon,
          value: option.name,
          group: t('search.suggestions'),
        }))
        .filter((option) =>
          shouldSearch
            ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
            : option?.value
                ?.toLowerCase()
                ?.includes(prevSearchTerm?.toLowerCase()),
        ),
      ...reducedCategories
        .map((option) => ({
          Icon: SearchIcon,
          group: t('search.categories'),
          value: option.name,
        }))
        .filter((option) =>
          shouldSearch
            ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
            : option?.value
                ?.toLowerCase()
                ?.includes(prevSearchTerm?.toLowerCase()),
        ),
      ...taxonomies.map((option) => ({
        group: t('search.taxonomies'),
        value: option.name,
        label: showTaxonomyBadge ? option.code : null,
      })),
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
        autoFocus: true,
        placeholder:
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || '',
      }}
      defaultOpen
      options={options}
      onInputChange={handleInputChange}
      onValueChange={setSearchTerm}
      optionsPopoverClassName="mt-[110px] max-h-[calc(100vh-360px)]"
      value={searchTerm}
    />
  );
}
