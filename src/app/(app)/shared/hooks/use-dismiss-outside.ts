'use client';

import { RefObject, useEffect, useRef } from 'react';

/**
 * Prototype: an open text box closes on a click or a scroll outside it.
 * Wheel and touch stand in for scroll: a phone's own scroll to a focused input must not close it.
 * The button that opens the box carries `data-dismiss-keep`, so it can still toggle it.
 */
export function useDismissOutside(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: () => void,
) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const onOutside = (event: Event) => {
      const target = event.target as Element;
      if (ref.current?.contains(target)) return;
      if (target.closest?.('[data-dismiss-keep]')) return;
      dismiss.current();
    };
    const events = ['pointerdown', 'wheel', 'touchmove'];
    for (const name of events) {
      document.addEventListener(name, onOutside, { passive: true });
    }
    return () => {
      for (const name of events) {
        document.removeEventListener(name, onOutside);
      }
    };
  }, [active, ref]);
}
