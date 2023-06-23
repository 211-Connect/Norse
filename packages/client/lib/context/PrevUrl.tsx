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
      console.log('prevUrl not found. set to:', cookies[PREV_URL]);
    }

    if (!currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(router.asPath)) {
        setCookie(null, PREV_URL, router.asPath);
        setPrevUrl(router.asPath);
        console.log(
          'Not on a resource detail page, setting prevUrl to',
          router.asPath
        );
      }

      currentUrl.current = router.asPath;
      console.log('currentUrl not found. set to', router.asPath);
    }

    // Update current url when path changes
    if (router.asPath !== currentUrl.current && currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(currentUrl.current)) {
        setCookie(null, PREV_URL, currentUrl.current);
        setPrevUrl(currentUrl.current);
      }
      currentUrl.current = router.asPath;
    }

    console.log(prevUrl);
  }, [router.asPath, router.isReady, prevUrl]);

  return (
    <prevUrlContext.Provider value={prevUrl}>
      {children}
    </prevUrlContext.Provider>
  );
};
