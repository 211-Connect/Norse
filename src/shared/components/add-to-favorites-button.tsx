import { useTranslation } from 'next-i18next';
import { Button } from './ui/button';
import { Heart, ListPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useSession } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import { dialogsAtom } from '../store/dialogs';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useDebounce } from '../hooks/use-debounce';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { FavoriteService } from '../services/favorite-service';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

type AddToFavoritesButtonProps = {
  size?: 'default' | 'icon';
  serviceAtLocationId: string;
};

export function AddToFavoritesButton({
  size = 'default',
  serviceAtLocationId,
}: AddToFavoritesButtonProps) {
  const { t } = useTranslation('common');
  const session = useSession();
  const setDialog = useSetAtom(dialogsAtom);
  const [open, setOpen] = useState(false);
  const [_value, setValue] = useState('');
  const value = useDebounce(_value, 200);
  const [fetching, setFetching] = useState<any>({
    data: [],
    status: 'loading',
  });

  const refreshFavoritesList = useCallback(async () => {
    if (session.status === 'unauthenticated' || session.status === 'loading')
      return;

    setFetching({ data: [], status: 'loading' });

    const favoriteLists = await FavoriteService.searchFavoriteLists(value);

    if (favoriteLists) {
      setFetching({ data: favoriteLists, status: 'success' });
      return;
    }
  }, [value, session.status]);

  const addToFavoriteList = (listId: string) => {
    return async () => {
      const data = await FavoriteService.addToFavoriteList({
        resourceId: serviceAtLocationId,
        favoriteListId: listId,
      });

      if (data) {
        toast.success(t('favorites.added_to_list'), {
          description: t('favorites.added_to_list_message'),
        });
      } else {
        toast.error(t('favorites.already_exists'), {
          description: t('favorites.already_exists_message'),
        });
      }
    };
  };

  const createNewList = () => {
    return async () => {
      const created = await FavoriteService.createFavoriteList({
        name: value,
        privacy: false,
      });

      if (created) {
        refreshFavoritesList();
      }
    };
  };

  useEffect(() => {
    refreshFavoritesList();
  }, [refreshFavoritesList]);

  const handleClick = () => {
    if (session.status === 'authenticated') {
      setOpen(true);
    } else {
      setDialog((prev) => ({
        ...prev,
        promptAuth: {
          ...prev.promptAuth,
          open: true,
        },
      }));
    }
  };

  return (
    <>
      <Button
        className={cn('flex gap-1', size === 'icon' && 'size-6')}
        size={size}
        variant={size === 'icon' ? 'ghost' : 'outline'}
        aria-label={t('call_to_action.add_to_list')}
        onClick={handleClick}
      >
        <Heart className={size === 'icon' ? 'size-6' : 'size-4'} />
        {size !== 'icon' && t('call_to_action.add_to_list')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modal.add_to_list.search_list')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              placeholder={t('modal.add_to_list.search_list')}
              value={_value}
              onChange={(e) => setValue(e.target.value)}
            />

            {fetching.status === 'success' &&
              fetching.data.length === 0 &&
              value?.length > 0 && (
                <div className="flex items-center gap-4">
                  <p className="text-sm text-red-600">
                    {t('modal.add_to_list.not_found')}
                  </p>

                  <Button variant="outline" size="sm" onClick={createNewList()}>
                    {t('modal.add_to_list.create_new_list')}
                  </Button>
                </div>
              )}

            <Separator />

            <div className="grid grid-cols-5 items-center gap-2">
              <p className="col-span-2 font-semibold">
                {t('modal.add_to_list.list_name')}
              </p>

              <p className="col-span-2 font-semibold">
                {t('modal.add_to_list.list_privacy')}
              </p>

              {fetching.status === 'loading' && (
                <>
                  <Skeleton className="col-span-2 h-6" />

                  <Skeleton className="col-span-2 h-6" />

                  <Skeleton className="h-6" />
                </>
              )}

              {fetching.status === 'success' && (
                <>
                  {fetching.data.map((el: any) => {
                    return (
                      <Fragment key={el._id}>
                        <p className="col-span-2 text-sm">{el.name}</p>

                        <div className="col-span-2">
                          <Badge variant="outline">
                            {el.privacy === 'PRIVATE'
                              ? t('list.private')
                              : t('list.public')}
                          </Badge>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={addToFavoriteList(el._id)}
                            aria-label={t('modal.add_to_list.add_to_list')}
                          >
                            <ListPlus className="size-4" />
                          </Button>
                        </div>
                      </Fragment>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
