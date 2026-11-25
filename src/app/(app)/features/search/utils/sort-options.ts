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
 * The options, in order. v2: Most Relevant, Nearest First (only with coordinates), organization (only when
 * the tenant shows service names), name. v1 keeps its order.
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

const V1_SORT_LABEL: Record<SortOption, string> = {
  relevance: 'Most Relevant',
  name: 'Resource Name',
  organization: 'Provider Name',
  distance: 'Nearest First',
};

/** v2 labels say what they sort by (Lucas 2026-11-20): `name` is the service's provider name. */
export const V2_SORT_LABEL = {
  relevance: 'Most Relevant',
  distance: 'Nearest First',
  name: 'Alphabetical by provider name',
  organization: 'Alphabetical by organization',
} as const;

export function sortLabel(value: SortOption, isV2: boolean): string {
  return isV2 ? V2_SORT_LABEL[value] : V1_SORT_LABEL[value];
}
