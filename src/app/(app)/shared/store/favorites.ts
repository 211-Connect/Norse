import { atom } from 'jotai';

import {
  FavoriteListDetailResponseDto,
  FavoriteListItemDto,
  TransformedResourceOpenApiDto,
} from '@/lib/api/generated/data-contracts';

export type Favorite = TransformedResourceOpenApiDto;

export type FavoriteListWithFavorites = {
  id: string;
  name: string;
  description: string;
  privacy: FavoriteListDetailResponseDto['privacy'];
  ownerId: string;
  viewingAsOwner: boolean;
  favorites: Favorite[];
};

export const favoriteListsStateAtom = atom<{
  data: FavoriteListItemDto[];
  totalCount: number;
  currentPage: number;
  limit: number;
}>({
  data: [],
  totalCount: 0,
  currentPage: 1,
  limit: 10,
});

export const favoriteListWithFavoritesAtom = atom<FavoriteListWithFavorites>({
  id: '',
  name: '',
  description: '',
  privacy: 'PRIVATE',
  ownerId: '',
  viewingAsOwner: false,
  favorites: [],
});
