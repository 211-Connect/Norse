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

/**
 * Clicks and focus that stay with the questions card on /find: the header (menu button, nav, logo)
 * and the menu panel it opens (another dialog, or its overlay). Lucas 2026-11-20: opening the menu
 * closed the questions and left /find.
 */
export const KEEPS_GUIDE_OPEN_SELECTOR =
  'header, [role="dialog"], [data-slot="sheet-overlay"]';

export function keepsGuideOpen(target: EventTarget | null): boolean {
  const element = target as { closest?: (selector: string) => unknown } | null;
  if (!element || typeof element.closest !== 'function') return false;
  return Boolean(element.closest(KEEPS_GUIDE_OPEN_SELECTOR));
}

/**
 * Back shows on a question only when the step before it was another question: never right after
 * the location question or the crisis (emergency) question (Lucas, 2026-11-20). `lastBackIdx` is
 * the answer Back would undo (-1: none).
 */
export function canGoBackFrom({
  onPage,
  asked,
  lastBackIdx,
  locationStep,
  emergencyId,
}: {
  onPage: boolean;
  asked: string[];
  lastBackIdx: number;
  locationStep: string;
  emergencyId: string;
}): boolean {
  if (!onPage || lastBackIdx < 0) return false;
  const previous = asked[asked.length - 1];
  return previous !== locationStep && previous !== emergencyId;
}

/**
 * Whether the guide shows its location step. Only an unanswered step shows, never for the emergency
 * question. The API caps the before_results questions, so the UI has no limit of its own. A tenant with requireUserLocation on always asks, also
 * when the engine has no question to ask, so no search starts without a place (Lucas 2026-11-20).
 */
export function asksLocationStep({
  locationDone,
  isEmergency,
  used,
  onPage,
  hasQuestions,
  requireLocation,
}: {
  locationDone: boolean;
  isEmergency: boolean;
  used: number;
  onPage: boolean;
  hasQuestions: boolean;
  requireLocation: boolean;
}): boolean {
  return (
    !locationDone &&
    !isEmergency &&
    (!onPage || hasQuestions || used > 0 || requireLocation)
  );
}
