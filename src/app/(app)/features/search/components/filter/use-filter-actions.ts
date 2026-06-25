'use client';

import { useCallback, useMemo } from 'react';

import { ActiveFilters } from './types';
import { useSearchResultsNavigation } from './use-search-results-navigation';

export function useFilterActions() {
  const { isPending, searchParamsObject, updateSearchParams } =
    useSearchResultsNavigation();

  const activeFilters = useMemo(
    () => (searchParamsObject.filters ?? {}) as ActiveFilters,
    [searchParamsObject.filters],
  );

  const applyFilters = useCallback(
    (newFilters?: ActiveFilters) => {
      updateSearchParams((params) => {
        if (!newFilters) {
          const next = { ...params };
          delete next.filters;
          return next;
        }

        return {
          ...params,
          filters: newFilters,
        };
      });
    },
    [updateSearchParams],
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
