import type { SortOption } from '@/app/(app)/shared/utils/getSortOption';

/**
 * The sort dropdown. v1 Hybrid/AI searches hide it (their order is one relevance score). The v2 engine
 * always shows it (David 2026-11-18, Lucas 2026-11-19): `/v2/search` takes the v1 `sort` parameter.
 */
export const showsSort = ({
  queryType,
  isV2,
}: {
  queryType: string | undefined;
  isV2: boolean;
}): boolean => isV2 || queryType !== 'hybrid';

/**
 * The options, in order. v2: Most Relevant, Nearest First (only with coordinates), Provider Name (only when
 * the tenant shows service names), Resource Name. v1 keeps its order.
 */
export const sortOptionValues = ({
  isV2,
  showServiceName,
  hasCoordinates,
}: {
  isV2: boolean;
  showServiceName: boolean;
  hasCoordinates: boolean;
}): SortOption[] => {
  const relevance: SortOption[] = ['relevance'];
  const distance: SortOption[] = hasCoordinates ? ['distance'] : [];
  const organization: SortOption[] = showServiceName ? ['organization'] : [];
  return isV2
    ? [...relevance, ...distance, ...organization, 'name']
    : [...relevance, 'name', ...organization, ...distance];
};
