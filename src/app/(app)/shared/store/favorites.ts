import { atom } from 'jotai';

import {
  FavoriteListDetailResponseDto,
  FavoriteListItemDto,
  TransformedResourceOpenApiDto,
} from '@/lib/api/generated/data-contracts';

export type Favorite = TransformedResourceOpenApiDto;

/**
 * The id a favorite is linked, stored and removed by: its serviceAtLocationId,
 * the same id search results and resource pages use. `_id` is only a fallback —
 * on some tenants (e.g. UWGKC, SCC) it is a Mongo ObjectId that differs from
 * the serviceAtLocationId, and `/search/<_id>` is not that resource's URL.
 */
export function getFavoriteResourceId(favorite: Favorite): string {
  return favorite.serviceAtLocationId ?? favorite._id ?? '';
}

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
