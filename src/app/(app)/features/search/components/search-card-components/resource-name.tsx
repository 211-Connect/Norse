'use client';

import { SearchCardComponentProps } from './types';
import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function ResourceNameComponent({ result }: SearchCardComponentProps) {
  if (!result.name) {
    return null;
  }

  const url = `/search/${result.id}${process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES === 'true' ? '/' : ''}`;

  return (
    <div className="flex flex-row justify-between gap-2">
      <Typography
        variant="heading"
        size="md"
        url={url}
        data-testid="resource-link"
        className="self-center"
      >
        {result.name}
      </Typography>
      <div className="print:hidden">
        <AddToFavoritesButton size="icon" serviceAtLocationId={result.id} />
      </div>
    </div>
  );
}
