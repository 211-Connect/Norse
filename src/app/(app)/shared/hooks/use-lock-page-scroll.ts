'use client';

import { useEffect } from 'react';

/**
 * Lucas 2026-11-16: while a popup is open, only the popup scrolls, not the page behind it.
 * The popup's own scroller sets `overscroll-behavior: contain` so a scroll at its end stays in it.
 */
export function useLockPageScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const before = [html.style.overflow, document.body.style.overflow];
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // iOS Safari ignores overflow on <body>: block wheel and touch scrolls outside any dialog.
    const block = (event: Event) => {
      const target = event.target as Element | null;
      if (!target?.closest?.('[role="dialog"]')) event.preventDefault();
    };
    document.addEventListener('wheel', block, { passive: false });
    document.addEventListener('touchmove', block, { passive: false });
    return () => {
      html.style.overflow = before[0];
      document.body.style.overflow = before[1];
      document.removeEventListener('wheel', block);
      document.removeEventListener('touchmove', block);
    };
  }, [active]);
}
