'use client';

import { Resource } from '@/types/resource';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';

export function ServiceNameComponent({ resource }: { resource: Resource }) {
  const showServiceName = useFlag('showSearchAndResourceServiceName');

  if (!showServiceName || !resource.serviceName) {
    return null;
  }

  return (
    <Typography variant="heading" size="sm" textColor="secondary">
      {resource.serviceName}
    </Typography>
  );
}
