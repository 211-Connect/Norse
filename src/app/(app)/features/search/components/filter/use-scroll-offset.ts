'use client';

import { useEffect } from 'react';

import { HEADER_ID } from '@/app/(app)/shared/lib/constants';

/**
 * Keeps the sticky filter panel following the page scroll (Facebook-style
 * sticky sidebar) so a panel taller than the viewport can still be scrolled
 * into view.
 *
 * Position updates are written directly to the DOM (bypassing React state)
 * and batched with requestAnimationFrame so the panel tracks scroll as
 * smoothly as native browser scrolling, instead of jittering a frame behind
 * due to a React re-render on every scroll event.
 */
export const useScrollOffset = () => {
  useEffect(() => {
    const element = document.querySelector('#filter-panel') as HTMLDivElement;
    const header = document.querySelector(`#${HEADER_ID}`) as HTMLDivElement;

    if (!element || !header) {
      return;
    }

    let maxMinusOffset = element.clientHeight - window.innerHeight;
    let maxPlusOffset = header.offsetHeight;
    let offset = maxPlusOffset;
    let lastScrollY = window.scrollY;
    let rafId: number | null = null;

    const clampOffset = () => {
      offset = Math.min(Math.max(offset, -maxMinusOffset), maxPlusOffset);
      element.style.top = `${offset}px`;
    };

    const handleResize = () => {
      maxMinusOffset = element.clientHeight - window.innerHeight;
      maxPlusOffset = header.offsetHeight;
      clampOffset();
    };

    const handleScroll = () => {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;

        const scrollY = window.scrollY;
        offset -= scrollY - lastScrollY;
        lastScrollY = scrollY;

        clampOffset();
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(element);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};
