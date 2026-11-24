'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Button } from '@payloadcms/ui';

import './LandingCopyFields.css';

/** Above the page list: download the selected tenant's pages as CSV. */
const LandingPagesExport = () => {
  const { selectedTenantID } = useTenantSelection();
  if (!selectedTenantID) return null;
  return (
    <div className="landing-pages-export">
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
