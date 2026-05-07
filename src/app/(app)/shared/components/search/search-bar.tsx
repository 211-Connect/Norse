'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { SearchIcon } from 'lucide-react';

import { searchTermAtom } from '../../store/search';
import { Autocomplete, AutocompleteOption } from '../ui/autocomplete';
import { useFlag } from '../../hooks/use-flag';
import { useAppConfig } from '../../hooks/use-app-config';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
import { useTaxonomies } from '../../hooks/api/use-taxonomies';
import { useDebounce } from '../../hooks/use-debounce';
import { SEARCH_DEBOUNCE_DELAY } from '../../lib/constants';

interface SearchBarProps {
  focusByDefault?: boolean;
  inputId?: string;
}

export function SearchBar({ focusByDefault = false, inputId }: SearchBarProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const searchTerm = useAtomValue(searchTermAtom);
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);
  const { setSearch } = useMainSearchLayoutContext();
  const { displayData: taxonomiesDisplay } = useTaxonomies(debouncedSearchTerm);

  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');
  const suggestions = appConfig.suggestions;
  const topics = appConfig.topics;

  const options = useMemo((): AutocompleteOption[] => {
    const suggestionHeaders = appConfig.search.texts?.suggestionHeaders;
    const suggestionsGroup =
      suggestionHeaders?.suggestions || t('search.suggestions');
    const categoriesGroup =
      suggestionHeaders?.categories || t('search.categories');
    const taxonomiesGroup =
      suggestionHeaders?.taxonomies || t('search.taxonomies');

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return suggestions.map((option) => ({
        Icon: SearchIcon,
        value: option.value,
        query: option.taxonomies,
        group: suggestionsGroup,
        queryType: 'taxonomy',
      }));
    }

    const suggestionList: AutocompleteOption[] = suggestions
      .map((option) => ({
        Icon: SearchIcon,
        value: option.value,
        query: option.taxonomies,
        group: suggestionsGroup,
        queryType: 'taxonomy',
      }))
      .filter((option) =>
        option?.value?.toLowerCase()?.includes(normalizedSearchTerm),
      );

    const topicList: AutocompleteOption[] = topics.list.flatMap((option) =>
      option.subtopics
        .filter((subtopic) =>
          subtopic.name.toLowerCase().includes(normalizedSearchTerm),
        )
        .map((subtopic) => ({
          Icon: SearchIcon,
          group: categoriesGroup,
          value: subtopic.name,
          query: subtopic.query || subtopic.name,
          queryType: subtopic.queryType || 'text',
        })),
    );

    const taxonomyList: AutocompleteOption[] = taxonomiesDisplay.map(
      (option) => ({
        group: taxonomiesGroup,
        value: option.name,
        query: option.code,
        badge: showTaxonomyBadge ? option.code : undefined,
        queryType: 'taxonomy',
      }),
    );

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
    topics,
    taxonomiesDisplay,
    appConfig.search.texts?.suggestionHeaders,
    t,
    searchTerm,
    showTaxonomyBadge,
  ]);

  const setSearchTerm = useCallback(
    (value: string, option?: AutocompleteOption) => {
      const query = option?.query ?? value;
      const queryType = option?.queryType ?? 'text';

      setSearch((prev) => ({
        ...prev,
        query,
        queryType,
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [setSearch],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setSearch((prev) => ({
        ...prev,
        query: value,
        queryType: 'text',
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [setSearch],
  );

  return (
    <Autocomplete
      className="search-box"
      readerLabel={t('search.query_input_label')}
      inputProps={{
        autoFocus: focusByDefault,
        id: inputId,
        placeholder:
          appConfig.search.texts?.queryInputPlaceholder ||
          t('search.query_placeholder'),
      }}
      defaultOpen={focusByDefault}
      Icon={SearchIcon}
      options={options}
      onInputChange={handleInputChange}
      onValueChange={setSearchTerm}
      clearButtonLabel={t('call_to_action.remove')}
      value={searchTerm}
      positionBelowElementId="search-form-inputs"
    />
  );
}
