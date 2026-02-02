'use client';

import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { useDebounce } from './use-debounce';
import { SubTopic, useTopics } from './use-topics';
import { useSuggestions } from './use-suggestions';
import { useTaxonomies } from './api/use-taxonomies';
import { searchAtom, searchLocationAtom } from '../store/search';
import { useLocations } from './api/use-locations';
import { deriveQueryType } from '../lib/search-utils';

export const useSearchResources = () => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);

  const debouncedSearchTerm = useDebounce(search.searchTerm, 200);
  const { data: taxonomies, displayData: displayTaxonomies } =
    useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();
  const topics = useTopics();

  const searchLocation = useAtomValue(searchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
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

  const resolveSearchTerm = useCallback(
    (value: string): { query: string; queryType: string } => {
      // Check for exact taxonomy match
      const taxonomy = taxonomies.find(
        (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (taxonomy) {
        return { query: taxonomy.code, queryType: 'taxonomy' };
      }

      // Check for suggestions (but keep as text search per existing logic)
      const suggestion = suggestions.find(
        (sugg) => sugg?.value?.toLowerCase() === value.toLowerCase(),
      );
      if (suggestion) {
        // Preserves existing behavior: returns suggestion code but uses text/derived type
        return {
          query: suggestion.taxonomies,
          queryType: deriveQueryType(value, undefined),
        };
      }

      // Check for reduced topics/categories
      const category = reducedTopics.find(
        (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
      );
      if (category) {
        return {
          query: category.query ?? value,
          queryType: 'taxonomy',
        };
      }

      // Default fallback
      return {
        query: value,
        queryType: deriveQueryType(value, undefined),
      };
    },
    [reducedTopics, suggestions, taxonomies],
  );

  return {
    resolveSearchTerm,
    locations,
    reducedTopics,
    search,
    setSearch,
    suggestions,
    taxonomies,
    displayTaxonomies,
  };
};
