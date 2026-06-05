'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useEffect } from 'react';

/**
 * Automatically selects the first available tenant when none is currently
 * selected. Mirrors the plugin's built-in behaviour for global collections.
 */
export default function TenantAutoSelect() {
  const { selectedTenantID, options, setTenant } = useTenantSelection();

  useEffect(() => {
    if (!selectedTenantID && options.length > 0) {
      setTenant({ id: options[0].value, refresh: true });
    }
  }, [selectedTenantID, options, setTenant]);

  return null;
}
