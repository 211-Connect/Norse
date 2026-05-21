'use client';

import { useAtom } from 'jotai';
import { ChevronLeft } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { favoriteListToPrintableDirectory } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { Link } from '@/app/(app)/shared/components/link';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { cn, withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';
import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { fontSans } from '@/app/(app)/shared/styles/fonts';

import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { Favorite } from './favorite';
import { FavoritesDirectoryPrintControl } from './favorites-directory-print-control';
import { NoFavoritesCard } from './no-favorites-card';
import { PurgeFavoriteListButton } from './purge-favorite-list-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';

type FavoritesSectionProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function FavoritesSection({ cardLayout }: FavoritesSectionProps) {
  const { t, i18n } = useTranslation('page-list');
  const [favoriteList, setFavoriteList] = useAtom(
    favoriteListWithFavoritesAtom,
  );
  const componentToPrint = useRef<HTMLDivElement>(null);
  const { stringifiedSearchParams } = useClientSearchParams();
  const printableDirectoryData = useMemo(
    () => favoriteListToPrintableDirectory(favoriteList, i18n.language),
    [favoriteList, i18n.language],
  );

  const handleRemoveFromList = (_listId: string, favoriteId: string) => {
    // Optimistically update the local atom by filtering out the removed favorite
    setFavoriteList((prev) => ({
      ...prev,
      favorites:
        prev.favorites?.filter((favorite) => favorite._id !== favoriteId) || [],
    }));
  };

  const handlePurge = () => {
    setFavoriteList((prev) => ({ ...prev, favorites: [] }));
  };

  return (
    <div className="flex w-full flex-col p-[10px] lg:max-w-[550px] lg:pl-[20px]">
      {/* Row 1: navigation + list actions */}
      <div className="flex items-center justify-between print:hidden">
        {favoriteList.viewingAsOwner ? (
          <Link
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'items-center gap-1',
            )}
            href={withOptionalTrailingSlash(
              `/favorites${stringifiedSearchParams}`,
            )}
            data-testid="back-to-favorites"
          >
            <ChevronLeft className="size-4" />
            {t('back_to_favorites')}
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <FavoritesDirectoryPrintControl data={printableDirectoryData} />

          <UpdateFavoriteListButton
            id={favoriteList.id}
            name={favoriteList.name}
            description={favoriteList.description}
            privacy={favoriteList.privacy}
          />

          <PurgeFavoriteListButton id={favoriteList.id} onPurge={handlePurge} />

          <DeleteFavoriteListButton
            id={favoriteList.id}
            name={favoriteList.name}
          />
        </div>
      </div>

      {/* Row 2: list name + privacy badge */}
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl font-semibold leading-tight">
          {favoriteList.name}
        </h1>
        <Badge variant="outline" className="bg-white">
          {t(`list.${favoriteList?.privacy?.toLowerCase()}`, {
            ns: 'common',
          })}
        </Badge>
      </div>

      {favoriteList.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {favoriteList.description}
        </p>
      )}

      {/* Share button row (public lists only) */}
      {favoriteList.privacy === 'PUBLIC' && (
        <div className="mt-2 flex justify-end print:hidden">
          <ShareButton
            title={favoriteList.name}
            body={favoriteList.description}
            componentToPrintRef={componentToPrint}
          />
        </div>
      )}

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
        ref={componentToPrint}
      >
        {favoriteList?.favorites?.map((list) => {
          return (
            <Favorite
              key={list._id}
              data={list}
              cardLayout={cardLayout}
              currentListId={favoriteList.id}
              onRemoveFromList={handleRemoveFromList}
            />
          );
        })}

        {favoriteList?.favorites?.length === 0 && <NoFavoritesCard />}
      </div>
    </div>
  );
}
