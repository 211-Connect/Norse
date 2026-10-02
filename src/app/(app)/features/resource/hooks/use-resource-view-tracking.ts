'use client';

import { useEffect, useRef } from 'react';

import {
  AnalyticsEvent,
  AnalyticsTools,
  ResourceEntry,
  consumePendingResourceEntry,
  trackEvent,
} from '@/app/(app)/shared/lib/analytics';

interface UseResourceViewTrackingArgs {
  resourceId: string;
  tenantId: string;
}

export function useResourceViewTracking({
  resourceId,
  tenantId,
}: UseResourceViewTrackingArgs): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    trackEvent(AnalyticsEvent.ResourceViewed, AnalyticsTools.Umami, {
      entry: consumePendingResourceEntry(resourceId) ?? ResourceEntry.DeepLink,
      resourceId,
      tenantId,
    });

    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('entry')) {
        url.searchParams.delete('entry');
        const cleaned = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(window.history.state, '', cleaned);
      }
    } catch {
      // best-effort URL cleanup; never block analytics on URL parsing errors
    }
  }, [resourceId, tenantId]);
}
