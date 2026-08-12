'use client';

import { useEffect, useRef } from 'react';

import {
  ResourceEntry,
  UmamiEvent,
  consumePendingResourceEntry,
  trackUmamiEvent,
} from '@/app/(app)/shared/lib/umami';

interface UseResourceViewTrackingArgs {
  /**
   * Optional explicit entry value, for callers that resolve it server-side
   * from a query param (e.g. external/deep-link routes that legitimately
   * accept `?entry=` since they aren't reached via a prefetchable in-app
   * `<Link>`). When omitted, the hook resolves `entry` itself from the
   * pending value recorded by `setPendingResourceEntry` (see
   * `docs/agents/prefetch-href-search-params-cost.md`), falling back to
   * `ResourceEntry.DeepLink` if nothing was recorded.
   */
  entry?: ResourceEntry;
  resourceId: string;
  tenantId: string;
}

/**
 * Fires the `ResourceViewed` Umami event exactly once per mount of the
 * resource page.
 *
 * After the event fires, the `entry` query param (if present, e.g. from a
 * legacy or external link) is stripped from the URL via
 * `window.history.replaceState` so that bookmarks, shares, reloads, and
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

    const resolvedEntry =
      entry ?? consumePendingResourceEntry(resourceId) ?? ResourceEntry.DeepLink;

    trackUmamiEvent(UmamiEvent.ResourceViewed, {
      entry: resolvedEntry,
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
