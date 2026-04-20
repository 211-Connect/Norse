'use client';

import { Resource } from '@/types/resource';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function LocationNameSubtitleComponent({
  resource,
}: {
  resource: Resource;
}) {
  if (!resource.locationName) {
    return null;
  }

  return (
    <Typography variant="heading" size="sm" textColor="secondary">
      {resource.locationName}
    </Typography>
  );
}
