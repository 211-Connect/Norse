import { atom } from 'jotai';
import { ApiResource, Address, Translation } from '@/types/resource';
import { FavoriteListState } from '@/types/favorites';

export interface Favorite extends ApiResource {
  addresses: Address[];
  translations: Translation[];
}

export type FavoriteListWithFavorites = {
  _id: string;
  name: string;
  description: string;
  privacy: FavoriteListState['privacy'];
  viewingAsOwner: boolean;
  favorites: Favorite[];
};

export const favoriteListsAtom = atom<FavoriteListState[]>([]);

export const favoriteListWithFavoritesAtom = atom<FavoriteListWithFavorites>({
  _id: '',
  name: '',
  description: '',
  privacy: 'PRIVATE' as FavoriteListState['privacy'],
  viewingAsOwner: false,
  favorites: [],
});

export const favoriteListsTotalAtom = atom<number>(0);
export const favoriteListsCurrentPageAtom = atom<number>(0);
export const favoriteListLimitAtom = atom<number>(10);
