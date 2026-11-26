'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { landingPageIdAtom } from '@/app/(app)/shared/store/search';

/**
 * Marks the landing page as the current analytics surface while it is shown,
 * so searches started from it carry `surface: landing` and its id.
 */
export function LandingAnalytics({ pageId }: { pageId: string }) {
  const setLandingPageId = useSetAtom(landingPageIdAtom);
  useEffect(() => {
    setLandingPageId(pageId);
    return () => setLandingPageId(null);
  }, [pageId, setLandingPageId]);
  return null;
}
