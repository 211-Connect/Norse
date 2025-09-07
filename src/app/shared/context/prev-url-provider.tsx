'use client';

import { useEffect, useRef, PropsWithChildren, useState, useMemo } from 'react';
import { getCookie, setCookie } from 'cookies-next/client';

import { PREV_URL } from '../lib/constants';
import { prevUrlContext } from './prev-url-context';
import { usePathname } from 'next/navigation';
import { useClientSearchParams } from '../hooks/use-client-search-params';

// Track current and previous url
export const PrevUrlProvider = ({ children }: PropsWithChildren) => {
  const [prevUrl, setPrevUrl] = useState<string>();
  const currentUrl = useRef<string>();
  const pathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const path = useMemo(() => {
    return stringifiedSearchParams
      ? `${pathname}${stringifiedSearchParams}`
      : pathname;
  }, [pathname, stringifiedSearchParams]);

  useEffect(() => {
    const resourceDetailsPage = /^\/search\/(\S*)/i;

    if (!prevUrl) {
      const prevUrl = getCookie(PREV_URL);
      setPrevUrl(prevUrl);
    }

    if (!currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(path)) {
        setCookie(PREV_URL, path, { path: '/' });
        setPrevUrl(path);
      }

      currentUrl.current = path;
    }

    // Update current url when path changes
    if (path !== currentUrl.current && currentUrl.current) {
      // Do not update prev url if current url is resource details page
      if (!resourceDetailsPage.test(currentUrl.current)) {
        setCookie(PREV_URL, currentUrl.current, { path: '/' });
        setPrevUrl(currentUrl.current);
      }
      currentUrl.current = path;
    }
  }, [path, prevUrl]);

  return (
    <prevUrlContext.Provider value={prevUrl}>
      {children}
    </prevUrlContext.Provider>
  );
};
