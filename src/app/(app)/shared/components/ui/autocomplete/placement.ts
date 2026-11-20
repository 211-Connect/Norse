export type ListPlacement = 'auto' | 'below';

/**
 * The Floating UI middleware the list uses, by name and in order. `auto` may flip above the
 * input when there is no room below. `below` never flips: the list stays under the input and
 * scrolls inside itself (`size` caps its height to the space below).
 */
export function listMiddlewareNames(placement: ListPlacement): string[] {
  return placement === 'below'
    ? ['offset', 'shift', 'size']
    : ['offset', 'flip', 'shift', 'size'];
}

/** Below this much free space under the input, a `below` list scrolls the input up first. */
export const MIN_LIST_SPACE_PX = 160;

/** A `below` list shows about 9 places before it scrolls inside itself (Lucas, 2026-11-20). */
export const LIST_MAX_HEIGHT_PX = 352;
/** A `below` list never gets shorter than about 3 places. */
export const LIST_MIN_HEIGHT_PX = 120;
/** Room kept under a `below` list for the card's bottom buttons. */
export const LIST_BOTTOM_RESERVE_PX = 96;

/**
 * Max height of a `below` list, which sits in the page flow under its input (so a card around it
 * grows instead of cutting it off). It fits in the visible viewport, which on a phone is the
 * part above the keyboard (`visualViewport.height`), and is capped so a long list (every
 * "Lincoln County") scrolls inside the list instead of making a huge card.
 */
export function belowListMaxHeight(
  visibleViewportHeight: number,
  inputBottom: number,
): number {
  const room = visibleViewportHeight - inputBottom - LIST_BOTTOM_RESERVE_PX;
  return Math.round(
    Math.min(LIST_MAX_HEIGHT_PX, Math.max(LIST_MIN_HEIGHT_PX, room)),
  );
}
