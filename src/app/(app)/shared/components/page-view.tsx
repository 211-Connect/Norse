'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useAppConfig } from '../hooks/use-app-config';
import { createPageViewEvent } from '../lib/google-tag-manager';

export function PageView() {
  const pathName = usePathname();
  const appConfig = useAppConfig();

  // Handle page views and fire event to event hub handlers
  useEffect(() => {
    createPageViewEvent({ url: window.location.href }, appConfig.sessionId);
  }, [pathName, appConfig.sessionId]);

  return null;
}
