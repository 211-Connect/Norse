'use client';

import { SearchCardComponentProps } from './types';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function ServiceNameComponent({ result }: SearchCardComponentProps) {
  if (!result.serviceName) {
    return null;
  }

  return (
    <Typography className="text-muted-foreground">
      {result.serviceName}
    </Typography>
  );
}
