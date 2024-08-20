import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { favoriteListsAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { SquarePen, Trash2 } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { CreateAListButton } from './create-a-list-button';
import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';

export function FavoriteListsSection() {
  const { t } = useTranslation('page-favorites');
  const favoriteLists = useAtomValue(favoriteListsAtom);

  return (
    <div className="flex w-full flex-col lg:max-w-[550px]">
      <div className="p-2">
        <CreateAListButton />
      </div>

      <div className="flex items-center justify-end bg-primary p-1 pl-2 pr-2 text-primary-foreground">
        <p>
          {favoriteLists.length}
          {` `}
          {t('lists')}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-2">
        {favoriteLists.map((list) => {
          return (
            <Card key={list._id}>
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
        })}
      </div>
    </div>
  );
}
