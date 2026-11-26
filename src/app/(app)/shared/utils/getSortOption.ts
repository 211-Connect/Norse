import { isValidCoordinate } from '@/utils/isValidCoordinate';

export type SortOption = 'relevance' | 'distance' | 'name' | 'organization';
export const isSortOption = (value: unknown): value is SortOption =>
  typeof value === 'string' &&
  ['relevance', 'distance', 'name', 'organization'].includes(value);

/**
 * The sort a search runs with. It is both what Norse-API is asked for and what
 * the "Sort by" control shows, so it must name the order the results come in.
 *
 * A stated sort wins, except `distance` without a valid origin, which the API
 * would rank by `_score` anyway. With no stated sort, a located search is
 * nearest first and an unlocated one is most relevant.
 *
 * `rankableByDistance` is false for hybrid searches (and for searches whose
 * type is not known to be text or taxonomy). Hybrid has no relevance gate
 * (`minimum_should_match: 0`), so nearest first would list every resource in
 * the radius regardless of the query, and its sort control is hidden, so the
 * user could not undo it (9a35c7cf, SCC211).
 */
export const getSortOption = (
  currentSort: string | null,
  coords: number[] | null | undefined,
  rankableByDistance = false,
): SortOption => {
  const located = isValidCoordinate(coords);

  if (isSortOption(currentSort)) {
    return currentSort === 'distance' && !located ? 'relevance' : currentSort;
  }

  return located && rankableByDistance ? 'distance' : 'relevance';
};
