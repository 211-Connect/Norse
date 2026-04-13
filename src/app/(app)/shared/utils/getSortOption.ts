export type SortOption = 'relevance' | 'distance' | 'name' | 'organization';
export const isSortOption = (value: unknown): value is SortOption =>
  typeof value === 'string' &&
  ['relevance', 'distance', 'name', 'organization'].includes(value);

export const getSortOption = (
  currentSort: string | null,
  coords: number[] | null | undefined,
): SortOption => {
  if (isSortOption(currentSort)) {
    if (currentSort === 'distance' && !Array.isArray(coords)) {
      return 'relevance';
    }

    return currentSort;
  }

  if (Array.isArray(coords) && coords.length === 2) {
    return 'distance';
  }

  return 'relevance';
};
