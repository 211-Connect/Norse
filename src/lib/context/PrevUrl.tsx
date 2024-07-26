import {
  useEffect,
  useRef,
  createContext,
  PropsWithChildren,
  useState,
} from 'react';
import { parseCookies, setCookie } from 'nookies';
import { useRouter } from 'next/router';
import { PREV_URL } from '../../lib/constants/cookies';

export const prevUrlContext = createContext<any>('');

// Track current and previous url
export const PrevUrlProvider = ({ children }: PropsWithChildren) => {
  const [prevUrl, setPrevUrl] = useState<string>();
  const currentUrl = useRef<string>();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const resourceDetailsPage = /^\/search\/(\S*)/i;

    if (!prevUrl) {
      const cookies = parseCookies();
      setPrevUrl(cookies[PREV_URL]);
    }

    if (!currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(router.asPath)) {
        setCookie(null, PREV_URL, router.asPath, { path: '/' });
        setPrevUrl(router.asPath);
      }

      currentUrl.current = router.asPath;
    }

    // Update current url when path changes
    if (router.asPath !== currentUrl.current && currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(currentUrl.current)) {
        setCookie(null, PREV_URL, currentUrl.current, { path: '/' });
        setPrevUrl(currentUrl.current);
      }
      currentUrl.current = router.asPath;
    }
  }, [router.asPath, router.isReady, prevUrl]);

  return (
    <prevUrlContext.Provider value={prevUrl}>
      {children}
    </prevUrlContext.Provider>
  );
};
