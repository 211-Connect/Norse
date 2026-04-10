'use client';

import { useEffect, useState } from 'react';

export function useBreakpoint(query: string | number): boolean {
  const mediaQuery =
    typeof query === 'number' ? `(min-width: ${query}px)` : query;

  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(mediaQuery);
    setMatches(media.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', handler);

    return () => media.removeEventListener('change', handler);
  }, [mediaQuery]);

  return matches;
}
