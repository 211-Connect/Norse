'use client';

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { FavoriteMapContainerBase } from './favorite-map-container-base';

export function FavoriteMapContainer() {
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);

  const markers = useMemo(() => {
    return (
      favoriteList?.favorites?.map((favorite) => {
        const coords = favorite.location?.coordinates;
        return {
          id: favorite._id,
          coordinates: isValidCoordinate(coords) ? coords : undefined,
        };
      }) ?? []
    );
  }, [favoriteList.favorites]);

  return <FavoriteMapContainerBase markers={markers} />;
}
