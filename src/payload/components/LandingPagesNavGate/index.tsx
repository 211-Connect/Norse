'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Hides the "Landing pages" nav group unless the selected tenant's Resource
 * Directory has `featureFlags.enableLandingPages` on. Payload's
 * `admin.hidden` only sees the user, not the selected tenant, and it would
 * also close the collection's routes, so the group is hidden with CSS.
 * Re-checks on every navigation, so saving the flag shows the group on the
 * next page.
 */
export default function LandingPagesNavGate() {
  const { selectedTenantID } = useTenantSelection();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!selectedTenantID) {
      setEnabled(false);
      return;
    }
    const controller = new AbortController();
    const query = new URLSearchParams({
      'where[tenant][equals]': String(selectedTenantID),
      depth: '0',
      limit: '1',
      'select[featureFlags][enableLandingPages]': 'true',
    });
    fetch(`/api/resource-directories?${query}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          body: {
            docs?: { featureFlags?: { enableLandingPages?: boolean } }[];
          } | null,
        ) =>
          setEnabled(
            Boolean(body?.docs?.[0]?.featureFlags?.enableLandingPages),
          ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setEnabled(false);
      });
    return () => controller.abort();
  }, [selectedTenantID, pathname]);

  if (enabled) return null;
  return (
    <style>{`.nav-group:has(#nav-landing-pages, #nav-landing-page-topics, #nav-landing-page-slugs) { display: none; }`}</style>
  );
}
