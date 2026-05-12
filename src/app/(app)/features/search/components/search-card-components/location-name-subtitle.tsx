'use client';

import { Typography } from '@/app/(app)/shared/components/ui/typography';

import { SearchCardComponentProps } from './types';

export function LocationNameSubtitleComponent({
  result,
}: SearchCardComponentProps) {
  if (!result.locationName) {
    return null;
  }

  return (
    <Typography className="text-muted-foreground">
      {result.locationName}
    </Typography>
  );
}
