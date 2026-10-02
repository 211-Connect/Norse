'use client';

import { useMemo } from 'react';

import { useHydrateAndSyncAtoms } from '@/app/(app)/shared/hooks/use-hydrate-and-sync-atoms';
import {
  FavoriteListWithFavorites,
  favoriteListWithFavoritesAtom,
  favoriteListsStateAtom,
} from '@/app/(app)/shared/store/favorites';
import { FavoriteListItemDto } from '@/lib/api/generated/data-contracts';

// These pages keep their data in atoms (rather than context like search
// results) because the UI edits it optimistically after the server render.

const FAVORITE_LISTS_PAGE_SIZE = 10;

export function FavoriteListsStateSync({
  favoriteLists,
  totalCount,
  currentPage,
}: {
  favoriteLists: FavoriteListItemDto[];
  totalCount: number;
  currentPage: number;
}) {
  const atomValues = useMemo(
    () =>
      [
        [
          favoriteListsStateAtom,
          {
            data: favoriteLists,
            totalCount,
            currentPage,
            limit: FAVORITE_LISTS_PAGE_SIZE,
          },
        ],
      ] as const,
    [currentPage, favoriteLists, totalCount],
  );

  useHydrateAndSyncAtoms(atomValues);

  return null;
}

export function FavoriteListStateSync({
  favoriteList,
  viewingAsOwner,
}: {
  favoriteList: Omit<FavoriteListWithFavorites, 'viewingAsOwner'>;
  viewingAsOwner: boolean;
}) {
  const atomValues = useMemo(
    () =>
      [
        [favoriteListWithFavoritesAtom, { ...favoriteList, viewingAsOwner }],
      ] as const,
    [favoriteList, viewingAsOwner],
  );

  useHydrateAndSyncAtoms(atomValues);

  return null;
}
