'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { RemoveFromFavoriteListButton } from '@/app/(app)/shared/components/remove-from-favorite-list-button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { ResourceEntry } from '@/app/(app)/shared/lib/umami';
import { withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';

import { SearchCardComponentProps } from './types';

export function ResourceNameComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation();
  const name = result.name || t('name_unavailable', { ns: 'page-search' });
  const searchParams = useSearchParams();
  const entry = searchParams.get('entry') ?? ResourceEntry.SearchCard;

  const url = `${withOptionalTrailingSlash(`/search/${result.id}`)}?entry=${entry}`;

  // Render RemoveFromFavoriteListButton when viewing a specific favorite list
  const isInFavoriteListContext = Boolean(
    result.currentListId && result.onRemoveFromList,
  );

  return (
    <div className="flex flex-row justify-between gap-2">
      <Typography
        variant="heading"
        size="md"
        url={url}
        data-testid="resource-link"
        className="min-w-0 flex-1 self-center"
      >
        {name}
      </Typography>
      <div className="flex flex-shrink-0 items-center print:hidden">
        {isInFavoriteListContext ? (
          <RemoveFromFavoriteListButton
            serviceAtLocationId={result.id}
            resourceName={name}
            currentListId={result.currentListId!}
            onRemoveFromList={result.onRemoveFromList!}
          />
        ) : (
          <AddToFavoritesButton
            size="icon"
            serviceAtLocationId={result.id}
            resourceName={name}
          />
        )}
      </div>
    </div>
  );
}
