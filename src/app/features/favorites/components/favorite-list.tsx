'use client';

import { Badge } from '@/app/shared/components/ui/badge';
import { buttonVariants } from '@/app/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { type FavoriteList } from '@/app/shared/store/favorites';
import { useTranslation } from 'react-i18next';
import { Link } from '@/app/shared/components/link';

import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';

export function FavoriteList({ list }: { list: FavoriteList }) {
  const { t } = useTranslation('page-favorites');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {t(`list.${list.privacy.toLowerCase()}`, { ns: 'common' })}
          </Badge>

          <div className="flex gap-2">
            <UpdateFavoriteListButton
              id={list._id}
              name={list.name}
              description={list.description}
              privacy={list.privacy}
            />

            <DeleteFavoriteListButton id={list._id} name={list.name} />
          </div>
        </div>
        <CardTitle>
          <Link href={`/favorites/${list._id}`}>{list.name}</Link>
        </CardTitle>
        <CardDescription>{list.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end">
        <Link
          className={buttonVariants({ variant: 'outline' })}
          href={`/favorites/${list._id}`}
        >
          {t('view_list')}
        </Link>
      </CardFooter>
    </Card>
  );
}
