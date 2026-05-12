'use client';

import { useTranslation } from 'react-i18next';

import { Link } from '@/app/(app)/shared/components/link';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { withOptionalTrailingSlash } from '@/app/(app)/shared/lib/utils';
import { FavoriteListState } from '@/types/favorites';

import { DeleteFavoriteListButton } from './delete-favorite-list-button';
import { UpdateFavoriteListButton } from './update-favorite-list-button';

export function FavoriteList({ list }: { list: FavoriteListState }) {
  const { t } = useTranslation('page-favorites');
  const { stringifiedSearchParams } = useClientSearchParams();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {t(`list.${list.privacy.toLowerCase()}`, { ns: 'common' })}
          </Badge>

          <div className="flex gap-2">
            <UpdateFavoriteListButton
              id={list.id}
              name={list.name}
              description={list.description}
              privacy={list.privacy}
            />

            <DeleteFavoriteListButton id={list.id} name={list.name} />
          </div>
        </div>
        <CardTitle>
          <Link
            href={withOptionalTrailingSlash(
              `/favorites/${list.id}${stringifiedSearchParams}`,
            )}
          >
            {list.name}
          </Link>
        </CardTitle>
        <CardDescription>{list.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end">
        <Link
          className={buttonVariants({ variant: 'outline' })}
          href={withOptionalTrailingSlash(
            `/favorites/${list.id}${stringifiedSearchParams}`,
          )}
        >
          {t('view_list')}
        </Link>
      </CardFooter>
    </Card>
  );
}
