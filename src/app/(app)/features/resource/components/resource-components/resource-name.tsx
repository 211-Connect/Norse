'use client';

import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { Resource } from '@/types/resource';

export function ResourceNameComponent({ resource }: { resource: Resource }) {
  if (!resource.name) {
    return null;
  }

  return (
    <Typography variant="heading" size="md" as="h1">
      {resource.name}
    </Typography>
  );
}
