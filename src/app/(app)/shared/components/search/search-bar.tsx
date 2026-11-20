'use client';

import { useAtomValue } from 'jotai';
import { SearchIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSearchSuggestions } from '../../hooks/api/use-search-suggestions';
import { useAppConfig } from '../../hooks/use-app-config';
import { useDebounce } from '../../hooks/use-debounce';
import { useFlag } from '../../hooks/use-flag';
import { SEARCH_DEBOUNCE_DELAY } from '../../lib/constants';
import { searchTermAtom } from '../../store/search';
import { Autocomplete, AutocompleteOption } from '../ui/autocomplete';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

interface SearchBarProps {
  focusByDefault?: boolean;
  inputId?: string;
  hideOptions?: boolean;
  onQueryInputChange?: () => void;
}

/**
 * The suggestion options for what is typed, as the search bar builds them: tenant suggestions,
 * topics, taxonomies and (with `enableOrganizationSearch`) organization rows, in the tenant's group
 * headings, with the tenant's badge flags. One builder for the v1 search bar and the v2 need box.
 */
export function useSearchBarOptions(
  searchTerm: string,
  { maxWords }: { maxWords?: number } = {},
): { options: AutocompleteOption[]; isLoading: boolean } {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);
  // `maxWords`: a longer text is a sentence, not a name to complete: no request, no options.
  const isSentence =
    maxWords !== undefined && searchTerm.trim().split(/\s+/).length > maxWords;
  const askedTerm =
    maxWords !== undefined &&
    debouncedSearchTerm.trim().split(/\s+/).length > maxWords
      ? ''
      : debouncedSearchTerm;
  const {
    taxonomies: taxonomiesDisplay,
    organizations: organizationsDisplay,
    isFetching: isFetchingSuggestions,
  } = useSearchSuggestions(askedTerm);
  // Covers the debounce window too, not just the request itself.
  const isLoadingSuggestions =
    !isSentence &&
    searchTerm.trim().length > 0 &&
    (searchTerm !== debouncedSearchTerm || isFetchingSuggestions);

  const showTaxonomyBadge = useFlag('showSuggestionListTaxonomyBadge');
  const enableOrganizationSearch = useFlag('enableOrganizationSearch');
  const showOrganizationLocationBadge = useFlag(
    'showOrganizationLocationBadge',
  );
  const suggestions = appConfig.suggestions;
  const topics = appConfig.topics;

  const options = useMemo((): AutocompleteOption[] => {
    if (isSentence) return [];
    const suggestionHeaders = appConfig.search.texts?.suggestionHeaders;
    const suggestionsGroup =
      suggestionHeaders?.suggestions || t('search.suggestions');
    const categoriesGroup =
      suggestionHeaders?.categories || t('search.categories');
    const taxonomiesGroup =
      suggestionHeaders?.taxonomies || t('search.taxonomies');
    const organizationsGroup =
      suggestionHeaders?.organizations || t('search.organizations');

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
          query: subtopic.queryType === 'link' ? undefined : subtopic.query,
          queryType: subtopic.queryType || 'text',
          href: subtopic.queryType === 'link' ? subtopic.href : undefined,
          target: subtopic.queryType === 'link' ? subtopic.target : undefined,
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

    const organizationList: AutocompleteOption[] = enableOrganizationSearch
      ? organizationsDisplay.map((org) => ({
          group: organizationsGroup,
          value: org.name,
          // Terminal org view: no text query — scope to the org by its stable
          // id and show all of its resources (backend match_all + org filter).
          query: '',
          organizationId: org.organization_id,
          badge:
            showOrganizationLocationBadge && org.city
              ? `${org.city}${org.state ? `, ${org.state}` : ''}`
              : undefined,
        }))
      : [];

    const atLeastTwo =
      [suggestionList, topicList, taxonomyList, organizationList].filter(
        (a) => a.length,
      ).length >= 2;

    return [
      ...suggestionList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...topicList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...taxonomyList.filter((_, index) => !(atLeastTwo && index > 5)),
      ...organizationList.filter((_, index) => !(atLeastTwo && index > 5)),
    ];
  }, [
    suggestions,
    topics,
    taxonomiesDisplay,
    organizationsDisplay,
    enableOrganizationSearch,
    showOrganizationLocationBadge,
    appConfig.search.texts?.suggestionHeaders,
    t,
    searchTerm,
    showTaxonomyBadge,
    isSentence,
  ]);

  return { options, isLoading: isLoadingSuggestions };
}

export function SearchBar({
  focusByDefault = false,
  inputId,
  hideOptions = false,
  onQueryInputChange,
}: SearchBarProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');
  const searchTerm = useAtomValue(searchTermAtom);
  const { setSearch } = useMainSearchLayoutContext();
  const { options, isLoading } = useSearchBarOptions(searchTerm);
  // Covers the debounce window too, not just the request itself.
  const isLoadingSuggestions = !hideOptions && isLoading;

  const setSearchTerm = useCallback(
    (value: string, option?: AutocompleteOption) => {
      const query = option?.query ?? '';
      const queryType = option?.queryType ?? 'text';
      const organizationId = option?.organizationId ?? '';
      const href = queryType === 'link' ? (option?.href ?? '') : '';
      const target = queryType === 'link' ? (option?.target ?? '') : '';

      setSearch((prev) => ({
        ...prev,
        query,
        queryType,
        organizationId,
        href,
        target,
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [setSearch],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      onQueryInputChange?.();

      setSearch((prev) => ({
        ...prev,
        query: value,
        queryType: 'text',
        // Typing a fresh query clears any organization scope from a prior pick.
        organizationId: '',
        href: '',
        target: '',
        searchTerm: value,
        queryLabel: value,
      }));
    },
    [setSearch, onQueryInputChange],
  );

  return (
    <Autocomplete
      className="search-box"
      wrapperTestId="search-field"
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
      options={hideOptions ? [] : options}
      onInputChange={handleInputChange}
      onCommit={setSearchTerm}
      clearButtonLabel={t('call_to_action.remove')}
      value={searchTerm}
      loading={isLoadingSuggestions}
      positionBelowElementId="search-form-inputs"
    />
  );
}
