import { Badge } from '@/shared/components/ui/badge';
import { buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { type FavoriteList } from '@/shared/store/favorites';

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
