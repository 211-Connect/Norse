'use client';

import { useAtom } from 'jotai';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { Link } from '@/app/(app)/shared/components/link';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { cn, withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';
import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { fontSans } from '@/app/(app)/shared/styles/fonts';

import { Favorite } from './favorite';
import { FavoriteListActions } from './favorite-list-actions';
import { NoFavoritesCard } from './no-favorites-card';

type FavoritesSectionProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function FavoritesSection({ cardLayout }: FavoritesSectionProps) {
  const { t } = useTranslation('page-list');
  const [favoriteList, setFavoriteList] = useAtom(
    favoriteListWithFavoritesAtom,
  );
  const { stringifiedSearchParams } = useClientSearchParams();

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
    <div className="flex w-full flex-col p-2.5 lg:max-w-137.5 lg:pl-5">
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

        <FavoriteListActions
          favoriteList={favoriteList}
          onPurge={handlePurge}
        />
      </div>

      {/* Row 2: list name + privacy badge */}
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl leading-tight font-semibold">
          {favoriteList.name}
        </h1>
        <Badge variant="outline" className="bg-white">
          {t(`list.${favoriteList?.privacy?.toLowerCase()}`, {
            ns: 'common',
          })}
        </Badge>
      </div>

      {favoriteList.description && (
        <p className="text-muted-foreground mt-1 text-sm">
          {favoriteList.description}
        </p>
      )}

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
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
