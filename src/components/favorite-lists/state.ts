import FavoriteAdapter from './adapters/favorite-adapter';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { IFavoriteList } from './types/FavoriteList';

export const favoriteListsAtom = atomWithQuery(() => ({
  initialData: [],
  queryKey: ['favorite', 'lists'],
  queryFn: async (): Promise<IFavoriteList[]> => {
    const favoriteAdapter = FavoriteAdapter();
    return await favoriteAdapter.getFavoriteLists();
  },
}));

export const deleteFavoriteListDialogAtom = atom({
  isOpen: false,
  id: '',
  name: '',
});

export const createFavoriteListDialogAtom = atom({
  isOpen: false,
});

export const updateFavoriteListDialogAtom = atom<{
  isOpen: boolean;
  title: string;
  list?: IFavoriteList;
}>({
  isOpen: false,
  title: '',
  list: null,
});
