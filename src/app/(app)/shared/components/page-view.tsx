'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useAppConfig } from '../hooks/use-app-config';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import { createPageViewEvent } from '../lib/google-tag-manager';

export function PageView() {
  const pathName = usePathname();
  const appConfig = useAppConfig();
  const { stringifiedSearchParams } = useClientSearchParams();

  // Combine pathname and query string so this recomputes on every search,
  // not just when navigating to a different route.
  const path = useMemo(
    () => `${pathName}${stringifiedSearchParams}`,
    [pathName, stringifiedSearchParams],
  );

  // Handle page views and fire event to event hub handlers
  useEffect(() => {
    createPageViewEvent({ url: window.location.href }, appConfig.sessionId);
  }, [path, appConfig.sessionId]);

  return null;
}
