import { useEffect, useState } from 'react';

export default function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const queryListener = (e) => {
      setMatches(e.target.matches);
    };

    const q = window.matchMedia(query);
    setMatches(q.matches);
    q.addEventListener('change', queryListener);

    return () => {
      q.removeEventListener('change', queryListener);
    };
  }, [query]);

  return matches;
}
