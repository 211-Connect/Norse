import { atomWithQuery } from 'jotai-tanstack-query';
import { IFavoriteListWithFavorites } from './types/Favorite';
import FavoriteAdapter from '../../adapters/favorite-adapter';
import router from 'next/router';
import { atom } from 'jotai';

export const favoriteListWithFavoritesAtom =
  atomWithQuery<IFavoriteListWithFavorites>(() => ({
    queryKey: [
      'favorite',
      'lists',
      typeof window !== 'undefined' ? router.query.id : '',
    ],
    queryFn: async (): Promise<IFavoriteListWithFavorites> => {
      const favoriteAdapter = FavoriteAdapter();
      return await favoriteAdapter.getFavoriteListById(
        router.query.id as string
      );
    },
  }));

export const deleteFavoriteFromFavoriteListDialogAtom = atom({
  isOpen: false,
  id: '',
  favoriteListId: '',
});

export const deleteFavoriteListDialogAtom = atom({
  isOpen: false,
  id: '',
  name: '',
});

export const updateFavoriteListDialogAtom = atom<{
  isOpen: boolean;
  title: string;
  list?: IFavoriteListWithFavorites;
}>({
  isOpen: false,
  title: '',
  list: null,
});
