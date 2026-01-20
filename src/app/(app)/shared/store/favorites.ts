import { atom } from 'jotai';
import { ApiResource, Address, Translation } from '@/types/resource';

export type FavoriteList = {
  _id: string;
  name: string;
  description: string;
  privacy: 'PRIVATE' | 'PUBLIC';
};

export interface Favorite extends ApiResource {
  addresses: Address[];
  translations: Translation[];
}

export type FavoriteListWithFavorites = {
  _id: string;
  name: string;
  description: string;
  privacy: 'PRIVATE' | 'PUBLIC';
  viewingAsOwner: boolean;
  favorites: Favorite[];
};

export const favoriteListsAtom = atom<FavoriteList[]>([]);

export const favoriteListWithFavoritesAtom = atom<FavoriteListWithFavorites>({
  _id: '',
  name: '',
  description: '',
  privacy: 'PRIVATE',
  viewingAsOwner: false,
  favorites: [],
});
