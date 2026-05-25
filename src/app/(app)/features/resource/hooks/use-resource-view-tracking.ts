'use client';

import { useEffect, useRef } from 'react';

import {
  ResourceEntry,
  UmamiEvent,
  trackUmamiEvent,
} from '@/app/(app)/shared/lib/umami';

interface UseResourceViewTrackingArgs {
  entry: ResourceEntry;
  resourceId: string;
  tenantId: string;
}

/**
 * Fires the `ResourceViewed` Umami event exactly once per mount of the
 * resource page. The `entry` value is resolved server-side from the
 * `?entry=…` query param before the page renders.
 *
 * After the event fires, the `entry` query param is stripped from the URL
 * via `window.history.replaceState` so that bookmarks, shares, reloads, and
 * back/forward navigation don't keep re-classifying this page as the same
 * entry point. We deliberately avoid `router.replace` here because it would
 * trigger a server re-render of this dynamic route.
 */
export function useResourceViewTracking({
  entry,
  resourceId,
  tenantId,
}: UseResourceViewTrackingArgs): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    trackUmamiEvent(UmamiEvent.ResourceViewed, {
      entry,
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
  }, [entry, resourceId, tenantId]);
}
