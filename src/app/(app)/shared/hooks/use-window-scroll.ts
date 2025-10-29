'use client';

import { useEffect, useState } from 'react';

export function useWindowScroll() {
  const [_scrollX, _setScrollX] = useState(0);
  const [_scrollY, _setScrollY] = useState(0);

  useEffect(() => {
    const scrollHandler = () => {
      _setScrollX(window.scrollX);
      _setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', scrollHandler);

    return () => window.removeEventListener('scroll', scrollHandler);
  }, []);

  return [_scrollX, _scrollY];
}
