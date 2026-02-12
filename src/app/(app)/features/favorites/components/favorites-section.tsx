'use client';

import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { useAtomValue } from 'jotai';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { useTranslation } from 'react-i18next';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';

import { Favorite } from './favorite';
import { NoFavoritesCard } from './no-favorites-card';
import { UpdateFavoriteListButton } from './update-favorite-list-button';
import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { Link } from '@/app/(app)/shared/components/link';

export function FavoritesSection() {
  const { t } = useTranslation('page-list');
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);
  const componentToPrint = useRef<HTMLDivElement>(null);
  const { stringifiedSearchParams } = useClientSearchParams();

  return (
    <div className="flex w-full flex-col p-[10px] lg:max-w-[550px] lg:pl-[20px]">
      <Card className="rounded-none border-none bg-transparent p-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between print:hidden">
            <Badge variant="outline" className="bg-white">
              {t(`list.${favoriteList?.privacy?.toLowerCase()}`, {
                ns: 'common',
              })}
            </Badge>

            <div className="flex gap-2">
              <UpdateFavoriteListButton
                id={favoriteList.id}
                name={favoriteList.name}
                description={favoriteList.description}
                privacy={favoriteList.privacy}
              />

              <DeleteFavoriteListButton
                id={favoriteList.id}
                name={favoriteList.name}
              />
            </div>
          </div>
          <CardTitle>{favoriteList.name}</CardTitle>
          <CardDescription>{favoriteList.description}</CardDescription>
        </CardHeader>
      </Card>

      <div
        className={cn(
          'mt-2 flex items-center print:hidden',
          !favoriteList.viewingAsOwner ? 'justify-end' : 'justify-between',
        )}
      >
        {favoriteList.viewingAsOwner && (
          <Link
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'items-center gap-1',
            )}
            href={`/favorites${stringifiedSearchParams}`}
          >
            <ChevronLeft className="size-4" />
            {t('back_to_favorites')}
          </Link>
        )}

        {favoriteList.privacy === 'PUBLIC' && (
          <ShareButton
            title={favoriteList.name}
            body={favoriteList.description}
            componentToPrintRef={componentToPrint}
          />
        )}
      </div>

      <div
        className={cn('mt-2 flex flex-col gap-2 font-sans', fontSans.variable)}
        ref={componentToPrint}
      >
        {favoriteList?.favorites?.map((list) => {
          return (
            <Favorite
              key={list._id}
              data={list}
              viewingAsOwner={favoriteList.viewingAsOwner}
              favoriteListId={favoriteList.id}
            />
          );
        })}

        {favoriteList?.favorites?.length === 0 && <NoFavoritesCard />}
      </div>
    </div>
  );
}
