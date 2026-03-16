'use client';

import { useCallback, useId, useMemo } from 'react';
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
  const labelId = useId();
  const prevSearchTerm = useAtomValue(prevSearchTermAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');

  const {
    reducedTopics,
    findCode,
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
        queryType: 'taxonomy',
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
        queryType: option.queryType,
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
      label: showTaxonomyBadge ? option.code : undefined,
      queryType: 'taxonomy',
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
    (value: string, option?: { queryType?: string }) => {
      const query = findCode(value);
      const queryType = option?.queryType ?? 'text';

      setShouldSearch(false);

      setSearch((prev) => ({
        ...prev,
        query: query ?? '',
        queryType,
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [findCode, setSearch, setShouldSearch],
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
    <>
      <label className="sr-only" htmlFor={inputId} id={labelId}>
        {t('search.query_input_label', {
          defaultValue: 'Search for resources',
        })}
      </label>
      <Autocomplete
        className="search-box"
        inputProps={{
          autoFocus: focusByDefault,
          id: inputId,
          'aria-labelledby': labelId,
          placeholder:
            appConfig.search.texts?.queryInputPlaceholder ||
            t('search.query_placeholder'),
        }}
        defaultOpen={focusByDefault}
        options={options}
        onInputChange={handleInputChange}
        onValueChange={setSearchTerm}
        getSuggestionsStatusMessage={(count) =>
          t('search.suggestions_status', {
            count,
            defaultValue:
              count === 1
                ? '1 suggestion available. Use the up and down arrow keys to review.'
                : `${count} suggestions available. Use the up and down arrow keys to review.`,
          })
        }
        optionsPopoverClassName="mt-2 max-h-[min(18rem,calc(100dvh-18rem))] sm:max-h-[min(20rem,calc(100dvh-22rem))]"
        value={searchTerm}
        blurOnOptionsInteraction
      />
    </>
  );
}
