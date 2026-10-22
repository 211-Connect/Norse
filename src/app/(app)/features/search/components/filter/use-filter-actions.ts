'use client';

import { useCallback, useMemo } from 'react';

import { UNSTATED } from '@/app/(app)/features/search/intent';

import { ActiveFilters } from './types';
import { useSearchResultsNavigation } from './use-search-results-navigation';

export function useFilterActions() {
  const { isPending, searchParamsObject, updateSearch } =
    useSearchResultsNavigation();

  const activeFilters = useMemo(
    () => (searchParamsObject.filters ?? {}) as ActiveFilters,
    [searchParamsObject.filters],
  );

  const applyFilters = useCallback(
    (newFilters?: ActiveFilters) => {
      updateSearch((intent) => ({
        ...intent,
        filters: newFilters ? { stated: true, value: newFilters } : UNSTATED,
      }));
    },
    [updateSearch],
  );

  const toggleFilter = useCallback(
    (key: string, value: string, checked: boolean) => {
      const current = Array.isArray(activeFilters[key])
        ? [...activeFilters[key]]
        : [];
      const next = checked
        ? [...new Set([...current, value])]
        : current.filter((v) => v !== value);

      applyFilters({
        ...activeFilters,
        [key]: next,
      });
    },
    [activeFilters, applyFilters],
  );

  return {
    isPending,
    activeFilters,
    applyFilters,
    toggleFilter,
  };
}
