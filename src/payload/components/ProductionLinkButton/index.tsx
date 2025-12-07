'use client';

import { Button, useField, usePayloadAPI } from '@payloadcms/ui';

const ProductionLinkButton = () => {
  const tenantId = useField({ path: 'tenant' }).value;

  const [{ data, isLoading }, { setParams }] = usePayloadAPI(
    `/api/tenants/${tenantId}`,
  );
  const trustedDomain = data?.trustedDomains?.[0]?.domain;

  if (isLoading)
    return (
      <Button disabled size="large">
        Loading...
      </Button>
    );

  if (!trustedDomain) return null;

  const url = `https://${trustedDomain}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button size="large">See Live Webpage</Button>
    </a>
  );
};

export default ProductionLinkButton;
