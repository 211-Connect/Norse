import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import { prevSearchTermAtom, searchTermAtom } from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useFlag } from '@/shared/hooks/use-flag';
import { Autocomplete } from '../ui/autocomplete';
import { useSearchResources } from '@/shared/hooks/use-search-resources';
import { SearchIcon } from 'lucide-react';

interface SearchBarProps {
  focusByDefault?: boolean;
  inputId?: string;
}

export function SearchBar({ focusByDefault = false, inputId }: SearchBarProps) {
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
    useSearchResources(shouldSearch ? debouncedSearchTerm : prevSearchTerm);

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    const suggestionList = suggestions
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
      );

    const categoryList = reducedCategories
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
      );

    const taxonomyList = taxonomies.map((option) => ({
      group: t('search.taxonomies'),
      value: option.name,
      label: showTaxonomyBadge ? option.code : null,
    }));

    const atLeastTwo =
      [suggestionList, categoryList, taxonomyList].filter((a) => a.length)
        .length >= 2;

    return [
      ...suggestionList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...categoryList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...taxonomyList.filter((_, index) => !(atLeastTwo && index > 5)),
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
      // If the value hasn't actually changed from the label, preserve existing query state
      if (value === searchTerm && searchTerm.length > 0) {
        setSearch((prev) => ({
          ...prev,
          searchTerm: value,
        }));
        setShouldSearch(true);
        return;
      }

      setShouldSearch(true);
      setSearch((prev) => ({
        ...prev,
        prevSearchTerm: value,
      }));
    },
    [setSearch, searchTerm],
  );

  return (
    <Autocomplete
      className="search-box"
      inputProps={{
        autoFocus: focusByDefault,
        id: inputId,
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
      optionsPopoverClassName="max-h-[calc(var(--vh)-240px)] mt-[110px] sm:max-h-[calc(var(--vh)-360px)]"
      value={searchTerm}
      blurOnOptionsInteraction
    />
  );
}
