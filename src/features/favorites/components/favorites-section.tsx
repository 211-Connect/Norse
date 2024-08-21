import { favoriteListWithFavoritesAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { Favorite } from './favorite';
import { useTranslation } from 'next-i18next';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { buttonVariants } from '@/shared/components/ui/button';
import Link from 'next/link';
import { ShareButton } from '@/shared/components/share-button';
import { useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import { UpdateFavoriteListButton } from './update-favorite-list-button';
import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { NoFavoritesCard } from './no-favorites-card';
import { fontSans } from '@/shared/styles/fonts';

export function FavoritesSection() {
  const { t } = useTranslation('page-list');
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);
  const componentToPrint = useRef();

  return (
    <div className="flex w-full flex-col lg:max-w-[550px]">
      <Card className="rounded-none border-none shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {t(`list.${favoriteList?.privacy?.toLowerCase()}`, {
                ns: 'common',
              })}
            </Badge>

            <div className="flex gap-2">
              <UpdateFavoriteListButton
                id={favoriteList._id}
                name={favoriteList.name}
                description={favoriteList.description}
                privacy={favoriteList.privacy}
              />

              <DeleteFavoriteListButton
                id={favoriteList._id}
                name={favoriteList.name}
              />
            </div>
          </div>
          <CardTitle>{favoriteList.name}</CardTitle>
          <CardDescription>{favoriteList.description}</CardDescription>
        </CardHeader>
        <CardFooter
          className={cn(
            'flex items-center',
            !favoriteList.viewingAsOwner ? 'justify-end' : 'justify-between',
          )}
        >
          {favoriteList.viewingAsOwner && (
            <Link
              className={cn(buttonVariants(), 'items-center gap-1')}
              href="/favorites"
            >
              <ChevronLeft className="size-4" />
              {t('back_to_favorites')}
            </Link>
          )}

          <ShareButton
            title={favoriteList.name}
            body={favoriteList.description}
            componentToPrintRef={componentToPrint}
          />
        </CardFooter>
      </Card>

      <div className="flex items-center justify-end bg-primary p-1 pl-2 pr-2 text-primary-foreground">
        <p>
          {favoriteList?.favorites?.length ?? 0}
          {` `}
          {t('favorites')}
        </p>
      </div>

      <div
        className={cn('flex flex-col gap-2 p-2 font-sans', fontSans.variable)}
        ref={componentToPrint}
      >
        {favoriteList?.favorites?.map((list) => {
          return (
            <Favorite
              key={list._id}
              data={list}
              viewingAsOwner={favoriteList.viewingAsOwner}
              favoriteListId={favoriteList._id}
            />
          );
        })}

        {favoriteList?.favorites?.length === 0 && <NoFavoritesCard />}
      </div>
    </div>
  );
}
