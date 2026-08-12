'use client';

import { useTranslation } from 'react-i18next';

import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { RemoveFromFavoriteListButton } from '@/app/(app)/shared/components/remove-from-favorite-list-button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { setPendingResourceEntry } from '@/app/(app)/shared/lib/umami';
import { withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';

import { SearchCardComponentProps } from './types';
import { useResourceCardEntry } from './use-resource-card-entry';

export function ResourceNameComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation();
  const name = result.name || t('name_unavailable', { ns: 'page-search' });
  const entry = useResourceCardEntry();

  // `entry` is intentionally not appended to the href: a non-routing query
  // string on a prefetchable `/search/{id}` link causes Next.js's Segment
  // Cache to create an extra prefetch request per link (see
  // docs/agents/prefetch-href-search-params-cost.md). It's instead recorded
  // via `setPendingResourceEntry` on click and read back on the destination
  // page.
  const url = withOptionalTrailingSlash(`/search/${result.id}`);

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
        prefetch={false}
        onClick={() => setPendingResourceEntry(result.id, entry)}
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
