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
