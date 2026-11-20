import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';

import { isPickedPlace } from './landing';

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

/**
 * The location step counts as answered only for a real place: one in the URL, a picked place
 * (a point or an area), or "Everywhere". Letters typed into the box and never picked do not
 * count (live walk 2026-11-20: "Rochester" + Enter skipped the step with no place saved).
 */
export function hasSavedLocation({
  urlLocation,
  urlCoords,
  searchLocation,
  searchCoordinates,
  searchRegion,
}: {
  urlLocation: string | null;
  urlCoords: string | null;
  searchLocation: string | null | undefined;
  searchCoordinates: number[] | string | null | undefined;
  searchRegion: string | null | undefined;
}): boolean {
  if (urlLocation || urlCoords) return true;
  if (!searchLocation) return false;
  return (
    isEverywhereLocation(searchLocation) ||
    isPickedPlace(searchCoordinates, searchRegion)
  );
}
