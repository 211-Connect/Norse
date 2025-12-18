'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { SearchIcon } from 'lucide-react';

import { prevSearchTermAtom, searchTermAtom } from '../../store/search';
import { Autocomplete } from '../ui/autocomplete';
import { useFlag } from '../../hooks/use-flag';
import { useAppConfig } from '../../hooks/use-app-config';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

interface SearchBarProps {
  focusByDefault?: boolean;
  inputId?: string;
}

export function SearchBar({ focusByDefault = false, inputId }: SearchBarProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');

  const {
    reducedTopics,
    findCode,
    getQueryType,
    setSearch,
    suggestions,
    displayTaxonomies: taxonomiesDisplay,
    shouldSearch,
    setShouldSearch,
  } = useMainSearchLayoutContext();

  // Remap and filter data as needed for the search box
  const options = useMemo(() => {
    const suggestionList = suggestions
      .map((option) => ({
        Icon: SearchIcon,
        value: option.value,
        group: t('search.suggestions'),
      }))
      .filter((option) =>
        shouldSearch
          ? option?.value?.toLowerCase()?.includes(searchTerm?.toLowerCase())
          : option?.value
              ?.toLowerCase()
              ?.includes(prevSearchTerm?.toLowerCase()),
      );

    const topicList = reducedTopics
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
      [suggestionList, topicList, taxonomyList].filter((a) => a.length)
        .length >= 2;

    return [
      ...suggestionList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...topicList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...taxonomyList.filter((_, index) => !(atLeastTwo && index > 5)),
    ];
  }, [
    suggestions,
    reducedTopics,
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
    [findCode, getQueryType, setSearch, setShouldSearch],
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
    [searchTerm, setShouldSearch, setSearch],
  );

  return (
    <Autocomplete
      className="search-box"
      inputProps={{
        autoFocus: focusByDefault,
        id: inputId,
        placeholder:
          appConfig.search.texts?.queryInputPlaceholder ||
          t('search.query_placeholder'),
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
