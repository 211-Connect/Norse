'use client';

import { ChevronLeft, Eraser } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CardLayoutRenderer } from '@/app/(app)/features/search/components/card-layout-renderer';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { Link } from '@/app/(app)/shared/components/link';
import {
  Button,
  buttonVariants,
} from '@/app/(app)/shared/components/ui/button';
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
import { localResourcesToPrintableDirectory } from '../utils/printable-directory-transformers';
import { FavoritesDirectoryPrintControl } from './favorites-directory-print-control';
import { PurgeConfirmDialog } from './purge-confirm-dialog';

const MAX_LOCAL_FAVORITES_FETCH = 100;

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
  const {
    localFavoriteIds,
    removeLocalFavorite,
    isLocalFavorite,
    clearLocalFavorites,
    hydrated,
  } = useLocalFavorites();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Fetch resources whenever the stored IDs change
  useEffect(() => {
    // Wait for hydration to avoid fetching with empty array
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      // Cap IDs to prevent unbounded API work
      const cappedIds = localFavoriteIds.slice(0, MAX_LOCAL_FAVORITES_FETCH);
      const fetched = await getResources(cappedIds, locale, tenantId);
      if (!cancelled) {
        setResources(fetched);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [hydrated, localFavoriteIds.join(','), locale, tenantId]);

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

  const localFavoriteResources = useMemo(
    () => resources.filter((resource) => isLocalFavorite(resource.id)),
    [resources, isLocalFavorite],
  );

  const printableDirectoryData = useMemo(
    () =>
      localResourcesToPrintableDirectory(
        localFavoriteResources,
        locale,
        t('local_list.title'),
      ),
    [localFavoriteResources, locale, t],
  );

  return (
    <div className="flex w-full flex-col p-6 lg:max-w-[550px] lg:pl-[20px]">
      <Card className="rounded-none border-none bg-transparent p-0 shadow-none">
        <CardHeader>
          <CardTitle>{t('local_list.title')}</CardTitle>
          <CardDescription>{t('local_list.description')}</CardDescription>
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
          {t('back_to_home')}
        </Link>

        {results.length > 0 && (
          <div className="flex items-center gap-2">
            <FavoritesDirectoryPrintControl
              data={printableDirectoryData}
              testId="print-local-directory-btn"
              showLabel={true}
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setClearConfirmOpen(true)}
              data-testid="purge-local-list-btn"
            >
              <Eraser className="size-4" />
              {t('purge_list.label')}
            </Button>
          </div>
        )}
      </div>

      <PurgeConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        onConfirm={() => {
          clearLocalFavorites();
          setResources([]);
          setClearConfirmOpen(false);
        }}
      />

      {loading && localFavoriteIds.length > 0 && (
        <div className="text-muted-foreground mt-4 text-sm">
          {t('local_list.loading')}
        </div>
      )}

      {!loading && results.length === 0 && (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="font-semibold">{t('local_list.empty_title')}</p>
            <p className="text-muted-foreground text-sm">
              {t('local_list.empty_description')}
            </p>
          </CardContent>
        </Card>
      )}

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
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
