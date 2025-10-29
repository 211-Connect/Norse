'use client';

import { useEffect } from 'react';
import { createPageViewEvent } from '../lib/google-tag-manager';
import { usePathname } from 'next/navigation';

export function PageView() {
  const pathName = usePathname();

  // Handle page views and fire event to event hub handlers
  useEffect(() => {
    createPageViewEvent({ url: window.location.href });
  }, [pathName]);

  return null;
}
