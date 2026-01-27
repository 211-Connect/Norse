'use client';

import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { useDebounce } from './use-debounce';
import { SubTopic, useTopics } from './use-topics';
import { useSuggestions } from './use-suggestions';
import { useTaxonomies } from './api/use-taxonomies';
import { searchAtom, searchLocationAtom } from '../store/search';
import { useLocations } from './api/use-locations';

export const useSearchResources = () => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);

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
    (value, query) => {
      // Check if user selected a taxonomy by name from the dropdown
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) return 'taxonomy';

      // Check if user selected a category from the dropdown
      const category = reducedTopics.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) return 'taxonomy';

      // For all other cases (including suggestions), derive based on the user input
      // This ensures "food" returns 'text' even if it matches suggestion values
      const { deriveQueryType } = require('../lib/search-utils');
      return deriveQueryType(value, undefined);
    },
    [reducedTopics, taxonomies],
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
