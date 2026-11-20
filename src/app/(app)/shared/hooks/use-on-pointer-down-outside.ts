import { useEffect } from 'react';

/** v1 default: a press outside (touch or mouse). */
export const POINTER_DOWN_EVENTS = ['touchstart', 'mousedown'];

/**
 * A press, wheel or touch-move outside. Wheel and touch-move stand in for scroll: a phone's own scroll
 * to a focused input must not close it. Used by the v2 inline boxes.
 */
export const POINTER_OR_SCROLL_EVENTS = ['pointerdown', 'wheel', 'touchmove'];

type Options = {
  /** Listen only while true (default true). */
  active?: boolean;
  /** Document events that count as "outside" (default `POINTER_DOWN_EVENTS`). */
  events?: string[];
  /** A target inside this selector never counts as outside (the button that toggles the box). */
  keepSelector?: string;
};

export function useOnPointerDownOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: PointerEvent) => void,
  {
    active = true,
    events = POINTER_DOWN_EVENTS,
    keepSelector,
  }: Options = {},
) {
  const eventKey = events.join(',');
  useEffect(() => {
    if (!active) return;
    const names = eventKey.split(',');
    const listener = (event: PointerEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) return;
      if (keepSelector && (event.target as Element).closest?.(keepSelector)) {
        return;
      }
      handler(event);
    };

    for (const name of names) {
      document.addEventListener(name, listener as EventListener, {
        passive: true,
      });
    }
    return () => {
      for (const name of names) {
        document.removeEventListener(name, listener as EventListener);
      }
    };
  }, [ref, handler, active, eventKey, keepSelector]);
}
