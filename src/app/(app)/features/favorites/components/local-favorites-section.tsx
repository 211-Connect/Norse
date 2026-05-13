'use client';

import { ChevronLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CardLayoutRenderer } from '@/app/(app)/features/search/components/card-layout-renderer';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { Link } from '@/app/(app)/shared/components/link';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { useLocalFavorites } from '@/app/(app)/shared/hooks/use-local-favorites';
import { cn, withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';
import { getResources } from '@/app/(app)/shared/services/resource-service';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { Resource } from '@/types/resource';

import {
  RemoveFromListHandler,
  resourceToLocalFavoriteResult,
} from '../utils/favorite-result-transformers';

type LocalFavoritesSectionProps = {
  cardLayout: SearchCardLayoutConfig;
  locale: string;
  tenantId?: string;
};

export function LocalFavoritesSection({
  cardLayout,
  locale,
  tenantId,
}: LocalFavoritesSectionProps) {
  const { t } = useTranslation('page-list');
  const { localFavoriteIds, removeLocalFavorite, isLocalFavorite } =
    useLocalFavorites();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const componentToPrint = useRef<HTMLDivElement>(null);

  // Fetch resources whenever the stored IDs change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const fetched = await getResources(localFavoriteIds, locale, tenantId);
      if (!cancelled) {
        setResources(fetched);
        setLoading(false);
      }
    }

    // Don't fetch on initial render before localStorage has hydrated
    // (localFavoriteIds starts as [] from SSR, becomes the real array after mount)
    load();

    return () => {
      cancelled = true;
    };
  }, [localFavoriteIds.join(','), locale, tenantId]);

  const handleRemoveFromList = useCallback<RemoveFromListHandler>(
    (_listId: string, favoriteId: string) => {
      removeLocalFavorite(favoriteId);
      setResources((prev) => prev.filter((r) => r.id !== favoriteId));
    },
    [removeLocalFavorite],
  );

  const results = resources
    .filter((r) => isLocalFavorite(r.id))
    .map((r) => resourceToLocalFavoriteResult(r, handleRemoveFromList));

  return (
    <div className="flex w-full flex-col p-6 lg:max-w-[550px] lg:pl-[20px]">
      <Card className="rounded-none border-none bg-transparent p-0 shadow-none">
        <CardHeader>
          <CardTitle>
            {t('local_list.title', { defaultValue: 'My Saved Resources' })}
          </CardTitle>
          <CardDescription>
            {t('local_list.description', {
              defaultValue:
                'Resources you save here are stored in your browser. Sign in to keep them across devices.',
            })}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-2 flex items-center justify-between print:hidden">
        <Link
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'items-center gap-1',
          )}
          href={withOptionalTrailingSlash('/')}
          data-testid="back-to-home"
        >
          <ChevronLeft className="size-4" />
          {t('back_to_home', { defaultValue: 'Back to Home' })}
        </Link>
      </div>

      {loading && localFavoriteIds.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          {t('local_list.loading', {
            defaultValue: 'Loading saved resources…',
          })}
        </div>
      )}

      {!loading && results.length === 0 && (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="font-semibold">
              {t('local_list.empty_title', {
                defaultValue: 'No saved resources yet',
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('local_list.empty_description', {
                defaultValue:
                  'Click the heart icon on any resource to add it here. Your selections are saved in this browser.',
              })}
            </p>
          </CardContent>
        </Card>
      )}

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
        ref={componentToPrint}
      >
        {results.map((result) => (
          <CardLayoutRenderer
            key={result._id}
            result={result}
            layout={cardLayout}
          />
        ))}
      </div>
    </div>
  );
}
