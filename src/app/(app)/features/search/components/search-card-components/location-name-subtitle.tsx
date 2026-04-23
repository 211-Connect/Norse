'use client';

import { SearchCardComponentProps } from './types';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

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
