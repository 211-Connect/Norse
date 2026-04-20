'use client';

import { Heart, HeartOff, Loader2, PlusIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import {
  Fragment,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

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
import { cn, withOptionalTrailingSlash } from '../lib/utils';
import { useAppConfig } from '../hooks/use-app-config';
import { getFavoriteLists } from '../serverActions/favorites/getFavoriteLists';
import { addToFavoriteList } from '../serverActions/favorites/addToFavoriteList';
import { removeFavoriteFromList } from '../serverActions/favorites/removeFavoriteFromList';
import { FavoriteListState } from '@/types/favorites';
import { FAVORITES_SEARCH_DEBOUNCE_DELAY } from '../lib/constants';

type AddToFavoritesButtonProps = {
  size?: 'default' | 'icon';
  serviceAtLocationId: string;
  resourceName?: string;
};

export function AddToFavoritesButton({
  size = 'default',
  serviceAtLocationId,
  resourceName,
}: AddToFavoritesButtonProps) {
  const appConfig = useAppConfig();
  const session = useSession();
  const setDialog = useSetAtom(dialogsAtom);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const { t, i18n } = useTranslation('common');

  const [open, setOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [favoritesState, setFavoritesState] = useState<{
    data: FavoriteListState[];
    status: 'idle' | 'refreshing' | 'loading' | 'success';
    page: number;
    limit: number;
    totalCount: number;
  }>({
    data: [],
    status: 'idle',
    page: 1,
    limit: 5,
    totalCount: 0,
  });
  const [refreshingListId, setRefreshingListId] = useState<string | null>(null);

  const refreshFavoritesList = useCallback(async () => {
    if (session.status === 'unauthenticated' || session.status === 'loading')
      return;

    setFavoritesState((prev) => ({
      ...prev,
      status: prev.data.length > 0 ? 'refreshing' : 'loading',
    }));

    const response = await getFavoriteLists(
      appConfig.tenantId,
      favoritesState.page,
      favoritesState.limit,
      searchValue,
      i18n.language,
      serviceAtLocationId,
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
    session.status,
    appConfig.tenantId,
    favoritesState.page,
    favoritesState.limit,
    searchValue,
    i18n.language,
    serviceAtLocationId,
  ]);

  useEffect(() => {
    if (open) {
      refreshFavoritesList();
    }
  }, [open, refreshFavoritesList]);

  const toggleFavoriteInList = (listId: string, isInList: boolean) => {
    return async () => {
      try {
        setRefreshingListId(listId);

        if (isInList) {
          await removeFavoriteFromList(
            {
              resourceId: serviceAtLocationId,
              favoriteListId: listId,
            },
            appConfig.tenantId,
          );

          toast.success(t('favorites.removed_from_list'), {
            description: t('favorites.removed_from_list_message'),
          });

          await refreshFavoritesList();
        } else {
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

            await refreshFavoritesList();
          } else {
            toast.error(t('favorites.already_exists'), {
              description: t('favorites.already_exists_message'),
            });
          }
        }
      } catch (error) {
        toast.error(t('message.error'), {
          description: t('favorites.unable_to_update_list_message'),
        });
      } finally {
        setRefreshingListId(null);
      }
    };
  };

  const handleCreateListSuccess = async () => {
    await refreshFavoritesList();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (session.status === 'authenticated') {
      triggerRef.current = event.currentTarget;
      setOpen(true);
    } else if (session.status === 'unauthenticated') {
      const trigger = event.currentTarget;
      setDialog((prev) => ({
        ...prev,
        promptAuth: {
          ...prev.promptAuth,
          open: true,
          returnFocusTo: trigger,
        },
      }));
    }
    // While session is 'loading', ignore the click — avoids showing
    // a login prompt to users whose session is still hydrating.
  };

  return (
    <>
      <Button
        ref={triggerRef}
        className={cn('flex gap-1', size === 'icon' && 'size-6')}
        size={size}
        variant={size === 'icon' ? 'ghost' : 'outline'}
        aria-label={
          resourceName
            ? `${t('call_to_action.add_to_list')} ${resourceName}`
            : t('call_to_action.add_to_list')
        }
        aria-haspopup="dialog"
        aria-controls={dialogId}
        data-testid="favorite-btn"
        onClick={handleClick}
        disabled={session.status === 'loading'}
        data-session-status={session.status}
      >
        <Heart
          className={size === 'icon' ? 'size-6' : 'size-4'}
          aria-hidden="true"
        />
        {size !== 'icon' && t('call_to_action.add_to_list')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id={dialogId}
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
        >
          <DialogHeader>
            <DialogTitle>{t('modal.manage_favorites.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('modal.manage_favorites.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <FavoritesSearchBar
                className="flex-1"
                placeholder={t('modal.add_to_list.search_list')}
                initialValue={searchValue}
                onChange={setSearchValue}
                debounceDelay={FAVORITES_SEARCH_DEBOUNCE_DELAY}
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
                  <Skeleton
                    className="col-span-2 h-6"
                    data-testid="favorites-loading-skeleton"
                  />
                  <Skeleton className="col-span-2 h-6" />
                  <Skeleton className="h-6" />
                </>
              )}

              {(favoritesState.status === 'success' ||
                favoritesState.status === 'refreshing') && (
                <>
                  <div data-testid="favorites-list-loaded" className="sr-only">
                    Favorites loaded
                  </div>

                  {favoritesState.data.length === 0 &&
                    searchValue?.length > 0 && (
                      <p className="col-span-5 text-sm text-muted-foreground">
                        {t('modal.add_to_list.not_found')}
                      </p>
                    )}

                  {favoritesState.data.map((el) => {
                    const isInList = el.containsResource ?? false;
                    return (
                      <Fragment key={el.id}>
                        <Link
                          href={withOptionalTrailingSlash(
                            `/${i18n.language}/favorites/${el.id}`,
                          )}
                          className="col-span-2 text-sm hover:underline"
                        >
                          {el.name}
                        </Link>

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
                            onClick={toggleFavoriteInList(el.id, isInList)}
                            aria-label={
                              isInList
                                ? t('call_to_action.remove_from_list')
                                : t('call_to_action.add_to_list')
                            }
                            data-testid={
                              isInList
                                ? 'remove-from-list-btn'
                                : 'add-to-list-btn'
                            }
                            disabled={refreshingListId === el.id}
                          >
                            {refreshingListId === el.id ? (
                              <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            ) : isInList ? (
                              <HeartOff className="size-4" />
                            ) : (
                              <Heart className="size-4" />
                            )}
                          </Button>
                        </div>
                      </Fragment>
                    );
                  })}
                </>
              )}
            </div>
            {(favoritesState.status === 'success' ||
              favoritesState.status === 'refreshing') &&
              favoritesState.totalCount > favoritesState.limit && (
                <div className="mt-4 flex justify-center">
                  <CustomPagination
                    total={Math.ceil(
                      favoritesState.totalCount / favoritesState.limit,
                    )}
                    totalResults={favoritesState.totalCount}
                    activePage={favoritesState.page}
                    siblings={1}
                    boundaries={1}
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
