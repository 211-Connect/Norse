import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'next-i18next';
import { prevSearchTermAtom, searchTermAtom } from '../../store/search';
import { useFlag } from '@/shared/hooks/use-flag';
import { Autocomplete } from '../ui/autocomplete';
import { SearchIcon } from 'lucide-react';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

interface SearchBarProps {
  focusByDefault?: boolean;
  inputId?: string;
}

export function SearchBar({ focusByDefault = false, inputId }: SearchBarProps) {
  const { t } = useTranslation();
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');

  const {
    findCode,
    getQueryType,
    setSearch,
    suggestions,
    displayTaxonomies: taxonomiesDisplay,
    shouldSearch,
    setShouldSearch,
    reducedCategories,
  } = useMainSearchLayoutContext();

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

    const taxonomyList = taxonomiesDisplay.map((option) => ({
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
    taxonomiesDisplay,
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
