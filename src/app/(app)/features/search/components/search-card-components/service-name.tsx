'use client';

import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { SearchCardComponentProps } from './types';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function ServiceNameComponent({ result }: SearchCardComponentProps) {
  const showServiceName = useFlag('showSearchAndResourceServiceName');

  if (!showServiceName || !result.serviceName) {
    return null;
  }

  return (
    <Typography className="text-muted-foreground">
      {result.serviceName}
    </Typography>
  );
}
