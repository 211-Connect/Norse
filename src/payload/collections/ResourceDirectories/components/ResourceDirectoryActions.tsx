'use client';

import React, { useState } from 'react';
import { toast, Button, useField } from '@payloadcms/ui';
import { getTrustedDomain } from '../../Tenants/actions/getTrustedDomain';

const ResourceDirectoryActions: React.FC = () => {
  const [isLoadingWebpage, setIsLoadingWebpage] = useState(false);
  const tenantId = useField({ path: 'tenant' }).value;

  const handleViewWebpage = async () => {
    if (!tenantId || typeof tenantId !== 'string') {
      toast.error('Tenant ID is required');
      return;
    }

    setIsLoadingWebpage(true);
    try {
      const domain = await getTrustedDomain(tenantId);
      if (domain) {
        window.open(`https://${domain}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No trusted domain configured for this tenant');
      }
    } catch (error) {
      console.error('Error fetching trusted domain:', error);
      toast.error('Failed to load webpage URL');
    } finally {
      setIsLoadingWebpage(false);
    }
  };

  return (
    <Button
      buttonStyle="primary"
      onClick={handleViewWebpage}
      disabled={isLoadingWebpage}
    >
      {isLoadingWebpage ? 'Loading...' : 'See Live Webpage'}
    </Button>
  );
};

export default ResourceDirectoryActions;
