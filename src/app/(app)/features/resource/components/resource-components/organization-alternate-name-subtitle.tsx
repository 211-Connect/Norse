'use client';

import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { Resource } from '@/types/resource';

export function OrganizationAlternateNameSubtitleComponent({
  resource,
}: {
  resource: Resource;
}) {
  if (!resource.organizationAlternateName) {
    return null;
  }

  return (
    <Typography variant="heading" size="sm" textColor="secondary" as="h3">
      {resource.organizationAlternateName}
    </Typography>
  );
}
