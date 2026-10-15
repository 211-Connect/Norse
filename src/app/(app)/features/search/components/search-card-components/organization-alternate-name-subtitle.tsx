'use client';

import { Typography } from '@/app/(app)/shared/components/ui/typography';

import { SearchCardComponentProps } from './types';

export function OrganizationAlternateNameSubtitleComponent({
  result,
}: SearchCardComponentProps) {
  if (!result.organizationAlternateName) {
    return null;
  }

  return (
    <Typography className="text-muted-foreground">
      {result.organizationAlternateName}
    </Typography>
  );
}
