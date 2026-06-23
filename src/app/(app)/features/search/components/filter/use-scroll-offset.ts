'use client';

import { useEffect, useRef, useState } from 'react';

import { HEADER_ID } from '@/app/(app)/shared/lib/constants';

export const useScrollOffset = () => {
  const [scrollOffset, setScrollOffset] = useState<number>();

  const lastScrollYRef = useRef(0);
  const scrollOffsetRef = useRef(scrollOffset);

  const maxMinusOffsetRef = useRef(0);
  const maxPlusOffsetRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleResize = () => {
      const element = document.querySelector('#filter-panel') as HTMLDivElement;
      const header = document.querySelector(`#${HEADER_ID}`) as HTMLDivElement;

      if (element && header) {
        maxMinusOffsetRef.current = element.clientHeight - window.innerHeight;
        maxPlusOffsetRef.current = header.offsetHeight;
      }
    };

    const handleScroll = () => {
      const delta = window.scrollY - lastScrollYRef.current;

      lastScrollYRef.current = window.scrollY;

      if (delta > 0) {
        if (scrollOffsetRef.current! <= -maxMinusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.max(
          (scrollOffsetRef.current ?? 0) - delta,
          -maxMinusOffsetRef.current,
        );
      } else if (delta < 0) {
        if (scrollOffsetRef.current! >= maxPlusOffsetRef.current) {
          return;
        }

        scrollOffsetRef.current = Math.min(
          scrollOffsetRef.current! - delta,
          maxPlusOffsetRef.current,
        );
      }

      setScrollOffset(scrollOffsetRef.current);
    };

    handleResize();

    const resize_ob = new ResizeObserver(handleResize);

    const element = document.querySelector('#filter-panel') as HTMLDivElement;
    if (element) {
      resize_ob.observe(element);
      const topStyle = window.getComputedStyle(element).top ?? '0px';
      const parsedStyle = parseInt(topStyle.replace('px', ''), 10);
      scrollOffsetRef.current = parsedStyle;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);

      if (element) {
        resize_ob.unobserve(element);
      }
    };
  }, []);

  return {
    scrollOffset,
  };
};
