import { isValidCoordinate } from '@/utils/isValidCoordinate';

export type SortOption = 'relevance' | 'distance' | 'name' | 'organization';
export const isSortOption = (value: unknown): value is SortOption =>
  typeof value === 'string' &&
  ['relevance', 'distance', 'name', 'organization'].includes(value);

export const getSortOption = (
  currentSort: string | null,
  coords: number[] | null | undefined,
): SortOption => {
  if (isSortOption(currentSort)) {
    // `distance` needs a real origin. Without one the API ranks by _score
    // anyway, so reporting relevance keeps the label and the behavior honest.
    if (currentSort === 'distance' && !isValidCoordinate(coords)) {
      return 'relevance';
    }

    return currentSort;
  }

  // Never infer an ordering from a location. Supplying one is a filtering
  // intent ("near me"), already served by coords + radius — not a ranking
  // intent ("ignore my search terms"). Inferring `distance` here silently
  // overrode relevance on every located search, and on `query_type=hybrid`
  // the sort control is not rendered, so it could be neither seen nor undone.
  return 'relevance';
};
