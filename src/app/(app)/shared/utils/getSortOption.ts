import { isSortOption, SortOption } from '../services/search-service';

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
