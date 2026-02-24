'use client';

import React, { useState } from 'react';
import { toast, Button, useField } from '@payloadcms/ui';
import { getTenantTrustedDomain } from '../../Tenants/actions/getTenantTrustedDomain';
import { TranslateButton } from './TranslateButton';
import { createLogger } from '@/lib/logger';

const log = createLogger('resource-directory-actions');

const ResourceDirectoryActions: React.FC = () => {
  const [isLoadingWebpage, setIsLoadingWebpage] = useState(false);
  const tenantId = useField({ path: 'tenant' }).value;

  if (!tenantId || typeof tenantId !== 'string') {
    return null;
  }

  const handleViewWebpage = async () => {
    setIsLoadingWebpage(true);
    try {
      const domain = await getTenantTrustedDomain(tenantId);
      if (domain) {
        window.open(`https://${domain}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No trusted domain configured for this tenant');
      }
    } catch (error) {
      log.error({ err: error }, 'Error fetching trusted domain');
      toast.error('Failed to load webpage URL');
    } finally {
      setIsLoadingWebpage(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <Button
        buttonStyle="primary"
        onClick={handleViewWebpage}
        disabled={isLoadingWebpage}
      >
        {isLoadingWebpage ? 'Loading...' : 'See Live Webpage'}
      </Button>
      <TranslateButton tenantId={tenantId} />
    </div>
  );
};

export default ResourceDirectoryActions;
