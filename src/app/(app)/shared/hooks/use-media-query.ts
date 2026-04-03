'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook to check if viewport width is larger than the specified breakpoint
 * @param minWidth - Minimum width in pixels
 * @returns true if viewport width >= minWidth
 */
export function useMinWidth(minWidth: number) {
  return useMediaQuery(`(min-width: ${minWidth}px)`);
}
