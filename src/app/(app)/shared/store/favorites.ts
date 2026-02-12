import { atom } from 'jotai';
import { ApiResource, Address, Translation } from '@/types/resource';
import { FavoriteListState } from '@/types/favorites';

export interface Favorite extends ApiResource {
  addresses: Address[];
  translations: Translation[];
}

export type FavoriteListWithFavorites = {
  id: string;
  name: string;
  description: string;
  privacy: FavoriteListState['privacy'];
  viewingAsOwner: boolean;
  favorites: Favorite[];
};

export const favoriteListsStateAtom = atom<{
  data: FavoriteListState[];
  totalCount: number;
  currentPage: number;
  limit: number;
  status: 'loading' | 'success';
}>({
  data: [],
  totalCount: 0,
  currentPage: 1,
  limit: 10,
  status: 'loading',
});

export const favoriteListWithFavoritesAtom = atom<FavoriteListWithFavorites>({
  id: '',
  name: '',
  description: '',
  privacy: 'PRIVATE' as FavoriteListState['privacy'],
  viewingAsOwner: false,
  favorites: [],
});
