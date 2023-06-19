import { useEffect, useRef, createContext, PropsWithChildren } from 'react';
import { parseCookies, setCookie } from 'nookies';
import { useRouter } from 'next/router';
import { PREV_URL } from '../../lib/constants/cookies';

export const prevUrlContext = createContext<any>('');

// Track current and previous url
export const PrevUrlProvider = ({ children }: PropsWithChildren) => {
  const prevUrl = useRef<string>();
  const currentUrl = useRef<string>();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const resourceDetailsPage = /^\/search\/(\S*)/i;

    if (!prevUrl.current) {
      const cookies = parseCookies();
      prevUrl.current = cookies[PREV_URL];
    }

    if (!currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(router.asPath)) {
        setCookie(null, PREV_URL, router.asPath);
        prevUrl.current = router.asPath;
      }

      currentUrl.current = router.asPath;
    }

    // Update current url when path changes
    if (router.asPath !== currentUrl.current && currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(currentUrl.current)) {
        setCookie(null, PREV_URL, currentUrl.current);
        prevUrl.current = currentUrl.current;
      }
      currentUrl.current = router.asPath;
    }
  }, [router.asPath, router.isReady]);

  return (
    <prevUrlContext.Provider value={prevUrl}>
      {children}
    </prevUrlContext.Provider>
  );
};
