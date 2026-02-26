'use client';

import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { deriveQueryType, QueryType } from '../lib/search-utils';
import { useDebounce } from './use-debounce';
import { useTopics } from './use-topics';
import { useSuggestions } from './use-suggestions';
import { useTaxonomies } from './api/use-taxonomies';
import { searchAtom, searchLocationAtom } from '../store/search';
import { useLocations } from './api/use-locations';
import { useAppConfig } from './use-app-config';
import { SubTopic } from '@/types/topics';

export const useSearchResources = () => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);
  const appConfig = useAppConfig();
  const hybridSemanticSearchEnabled =
    appConfig.search.hybridSemanticSearchEnabled;

  const debouncedSearchTerm = useDebounce(search.searchTerm, 1000);
  const { data: taxonomies, displayData: displayTaxonomies } =
    useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();
  const topics = useTopics();

  const searchLocation = useAtomValue(searchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 1000);
  const { data: locations } = useLocations(debouncedSearchLocation);

  const reducedTopics: {
    name: string;
    query?: string;
    queryType?: string;
  }[] = useMemo(() => {
    if (search.searchTerm.length === 0) return [];

    return topics
      .reduce<SubTopic[]>((prev, current) => {
        const subTopics = current.subtopics;
        if (subTopics.length > 0) {
          return prev.concat(subTopics);
        }

        return prev;
      }, [])
      .filter(
        ({ name, href }) =>
          !href &&
          name &&
          name.toLowerCase().includes(search.searchTerm.toLowerCase()),
      );
  }, [topics, search.searchTerm]);

  const findCode = useCallback(
    (value: string) => {
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return taxonomy.code;

      const suggestion = suggestions.find(
        (sugg) => sugg?.value?.toLowerCase() === value.toLowerCase(),
      );
      if (suggestion) return suggestion.taxonomies;

      const category = reducedTopics.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) return category.query;

      return value;
    },
    [reducedTopics, suggestions, taxonomies],
  );

  const getQueryType = useCallback(
    (value: string, effectiveQuery: string | undefined): QueryType => {
      // Check if user selected a taxonomy by name from the dropdown
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return QueryType.Taxonomy;

      // Check if user selected a category from the dropdown
      const category = reducedTopics.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) return QueryType.Taxonomy;

      // For all other cases (including suggestions), derive based on the user input
      // This ensures "food" returns 'text' even if it matches suggestion values
      return deriveQueryType(
        effectiveQuery,
        search.queryType,
        hybridSemanticSearchEnabled,
      );
    },
    [reducedTopics, taxonomies, search.queryType, hybridSemanticSearchEnabled],
  );

  return {
    findCode,
    getQueryType,
    locations,
    reducedTopics,
    search,
    setSearch,
    suggestions,
    taxonomies,
    displayTaxonomies,
  };
};
