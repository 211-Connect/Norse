'use client';

import { Heart, ListPlus, PlusIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/button';
import { CustomPagination } from './custom-pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { CreateFavoriteListDialog } from './create-favorite-list-dialog';
import { FavoritesSearchBar } from './favorites-search-bar';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { dialogsAtom } from '../store/dialogs';
import { cn } from '../lib/utils';
import { useAppConfig } from '../hooks/use-app-config';
import { getFavoriteLists } from '../serverActions/favorites/getFavoriteLists';
import { createFavoriteList } from '../serverActions/favorites/createFavoriteList';
import { addToFavoriteList } from '../serverActions/favorites/addToFavoriteList';
import { FavoriteListState } from '@/types/favorites';

type AddToFavoritesButtonProps = {
  size?: 'default' | 'icon';
  serviceAtLocationId: string;
  siblings?: number;
  boundaries?: number;
};

export function AddToFavoritesButton({
  size = 'default',
  serviceAtLocationId,
  siblings = 1,
  boundaries = 1,
}: AddToFavoritesButtonProps) {
  const appConfig = useAppConfig();
  const session = useSession();
  const setDialog = useSetAtom(dialogsAtom);
  const { t } = useTranslation('common');

  const [open, setOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [favoritesState, setFavoritesState] = useState<{
    data: FavoriteListState[];
    status: 'loading' | 'success';
    page: number;
    limit: number;
    totalCount: number;
  }>({
    data: [],
    status: 'loading',
    page: 1,
    limit: 5,
    totalCount: 0,
  });

  const refreshFavoritesList = useCallback(async () => {
    if (session.status === 'unauthenticated' || session.status === 'loading')
      return;

    setFavoritesState((prev) => ({ ...prev, data: [], status: 'loading' }));

    const response = await getFavoriteLists(
      appConfig.tenantId,
      favoritesState.page,
      favoritesState.limit,
      searchValue,
    );

    if (response) {
      setFavoritesState((prev) => ({
        ...prev,
        data: response.data,
        status: 'success',
        totalCount: response.totalCount,
      }));
    }
  }, [
    session,
    searchValue,
    appConfig,
    favoritesState.page,
    favoritesState.limit,
  ]);

  useEffect(() => {
    if (open) {
      refreshFavoritesList();
    }
  }, [refreshFavoritesList, open]);

  const addToFavoriteListHandler = (listId: string) => {
    return async () => {
      try {
        const data = await addToFavoriteList(
          {
            resourceId: serviceAtLocationId,
            favoriteListId: listId,
          },
          appConfig.tenantId,
        );

        if (data) {
          toast.success(t('favorites.added_to_list'), {
            description: t('favorites.added_to_list_message'),
          });
        } else {
          toast.error(t('favorites.already_exists'), {
            description: t('favorites.already_exists_message'),
          });
        }
      } catch (error) {
        toast.error(t('message.error'), {
          description: t('favorites.unable_to_update_list_message'),
        });
      }
    };
  };

  const handleCreateListSuccess = async () => {
    await refreshFavoritesList();
  };

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
            <div className="flex flex-col gap-2 sm:flex-row">
              <FavoritesSearchBar
                className="flex-1"
                placeholder={t('modal.add_to_list.search_list')}
                initialValue={searchValue}
                onChange={setSearchValue}
              />
              <Button
                variant="outline"
                className="flex h-9 gap-1"
                onClick={() => setCreateListOpen(true)}
              >
                <PlusIcon className="size-4" />
                {t('modal.create_list.create_a_list')}
              </Button>
            </div>

            {favoritesState.status === 'success' &&
              favoritesState.data.length === 0 &&
              searchValue?.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('modal.add_to_list.not_found')}
                </p>
              )}

            <Separator />

            <div className="grid grid-cols-5 items-center gap-2">
              <p className="col-span-2 font-semibold">
                {t('modal.add_to_list.list_name')}
              </p>

              <p className="col-span-2 font-semibold">
                {t('modal.add_to_list.list_privacy')}
              </p>

              {favoritesState.status === 'loading' && (
                <>
                  <Skeleton className="col-span-2 h-6" />

                  <Skeleton className="col-span-2 h-6" />

                  <Skeleton className="h-6" />
                </>
              )}

              {favoritesState.status === 'success' && (
                <>
                  {favoritesState.data?.map((el) => {
                    return (
                      <Fragment key={el.id}>
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
                            onClick={addToFavoriteListHandler(el.id)}
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
            {favoritesState.status === 'success' &&
              favoritesState.totalCount > favoritesState.limit && (
                <div className="mt-4 flex justify-center">
                  <CustomPagination
                    total={Math.ceil(
                      favoritesState.totalCount / favoritesState.limit,
                    )}
                    totalResults={favoritesState.totalCount}
                    activePage={favoritesState.page}
                    siblings={siblings}
                    boundaries={boundaries}
                    onPageChange={(page) =>
                      setFavoritesState((prev) => ({ ...prev, page }))
                    }
                  />
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateFavoriteListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        onSuccess={handleCreateListSuccess}
      />
    </>
  );
}
