'use client';

import { SearchCardComponentProps } from './types';
import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function ResourceNameComponent({ result }: SearchCardComponentProps) {
  if (!result.name) {
    return null;
  }

  // For regular <a> tags (not Next.js Link), we need to manually include basePath
  const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';
  const url = `${basePath}/search/${result.id}${process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES === 'true' ? '/' : ''}`;

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
