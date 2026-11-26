'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Button } from '@payloadcms/ui';

import './LandingCopyFields.css';

/** The list filtered to `resultCount = 0`, in Payload's list URL format (it shows in Filters). */
const ZERO_RESULTS_HREF =
  '/admin/collections/landing-pages?where%5Bor%5D%5B0%5D%5Band%5D%5B0%5D%5BresultCount%5D%5Bequals%5D=0';

/**
 * Above the page list: the "0 results" filter, and the selected tenant's
 * pages as CSV.
 */
const LandingPagesExport = () => {
  const { selectedTenantID } = useTenantSelection();
  if (!selectedTenantID) return null;
  return (
    <div className="landing-pages-export">
      <Button
        el="anchor"
        buttonStyle="secondary"
        size="small"
        url={ZERO_RESULTS_HREF}
      >
        0 results
      </Button>
      <Button
        el="anchor"
        buttonStyle="secondary"
        size="small"
        url={`/api/landing-pages/admin/export?tenantId=${encodeURIComponent(String(selectedTenantID))}`}
        newTab
      >
        Export CSV
      </Button>
    </div>
  );
};

export default LandingPagesExport;
