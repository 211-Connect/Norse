import { useEffect, useState } from 'react';

export default function useWindowScroll() {
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setScrollPos({ x: window.scrollX, y: window.scrollY });

    const scrollListener = () => {
      setScrollPos({ x: window.scrollX, y: window.scrollY });
    };

    window.addEventListener('scroll', scrollListener);

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  return [scrollPos];
}
