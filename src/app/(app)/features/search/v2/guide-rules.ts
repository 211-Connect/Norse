/** After a place is picked in the guide, the card shows its loading state for at least this long. */
export const MIN_PLACE_LOADING_MS = 800;

/**
 * The guide's bottom bar (Skip, Not now, Continue, Show results now) shows only when nothing
 * is loading: not while the first answer waits, a step loads, or a picked place is saved.
 */
export function showBottomBar({
  waiting,
  showBar,
  isPending,
  placeSaving,
}: {
  waiting: boolean;
  showBar: boolean;
  isPending: boolean;
  placeSaving: boolean;
}): boolean {
  return !waiting && showBar && !isPending && !placeSaving;
}
