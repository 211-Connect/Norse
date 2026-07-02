'use client';

import { useMemo } from 'react';

import { AppConfig } from '@/types/appConfig';

import { FacetUiConfig } from './types';

export function useFacetUiConfig(
  facets: AppConfig['search']['facets'],
): FacetUiConfig {
  return useMemo(() => {
    const excludedValuesMap = new Map<string, Set<string>>();
    const sortModesMap = new Map<
      string,
      'count' | 'name' | 'valueOrder' | 'dayOfWeek'
    >();
    const customValueOrdersMap = new Map<string, string[]>();

    for (const facetConfig of facets) {
      sortModesMap.set(facetConfig.facet, facetConfig.sortBy || 'count');

      if (facetConfig.valueOrder?.length) {
        customValueOrdersMap.set(facetConfig.facet, facetConfig.valueOrder);
      }

      if (facetConfig.excludeValues?.length) {
        excludedValuesMap.set(
          facetConfig.facet,
          new Set(
            facetConfig.excludeValues.map((value) =>
              value.trim().toLocaleLowerCase(),
            ),
          ),
        );
      }
    }

    return {
      excludedValues: excludedValuesMap,
      sortModes: sortModesMap,
      customValueOrders: customValueOrdersMap,
    };
  }, [facets]);
}
