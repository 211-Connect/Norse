import { useEffect, useState } from 'react';
import { useThrottle } from './use-throttle';

export function useWindowScroll() {
  const [_scrollX, _setScrollX] = useState(0);
  const [_scrollY, _setScrollY] = useState(0);

  const throttledSetValue = useThrottle((x, y) => {
    _setScrollX(x);
    _setScrollY(y);
  }, 100);

  useEffect(() => {
    const scrollHandler = () => {
      throttledSetValue(window.scrollX, window.scrollY);
    };

    window.addEventListener('scroll', scrollHandler);

    return () => window.removeEventListener('scroll', scrollHandler);
  }, []);

  return [_scrollX, _scrollY];
}
