'use client';

import { useEffect } from 'react';
import { createPageViewEvent } from '../lib/google-tag-manager';
import { usePathname } from 'next/navigation';
import { useAppConfig } from '../hooks/use-app-config';

export function PageView() {
  const pathName = usePathname();
  const appConfig = useAppConfig();

  // Handle page views and fire event to event hub handlers
  useEffect(() => {
    createPageViewEvent({ url: window.location.href }, appConfig.sessionId);
  }, [pathName, appConfig.sessionId]);

  return null;
}
