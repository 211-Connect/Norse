'use client';

import { useEffect, useRef } from 'react';

import {
  ResourceEntry,
  UmamiEvent,
  consumePendingResourceEntry,
  trackUmamiEvent,
} from '@/app/(app)/shared/lib/umami';

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

    trackUmamiEvent(UmamiEvent.ResourceViewed, {
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
