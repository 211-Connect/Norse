'use client';

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import {
  favoriteListWithFavoritesAtom,
  getFavoriteResourceId,
} from '@/app/(app)/shared/store/favorites';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { FavoriteMapContainerBase } from './favorite-map-container-base';
import { createLogger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const logger = createLogger('FavoriteMapContainer');

export function FavoriteMapContainer() {
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);

  const markers = useMemo(() => {
    return (
      favoriteList?.favorites?.map((favorite) => {
        const coords = favorite.location?.coordinates;

        const id = getFavoriteResourceId(favorite);

        if (!id) {
          logger.warn(
            `Missing id for favorite: ${favorite.displayName ?? 'unknown'}`,
          );
        }

        return {
          id: id || randomUUID(),
          coordinates: isValidCoordinate(coords) ? coords : undefined,
        };
      }) ?? []
    );
  }, [favoriteList.favorites]);

  return <FavoriteMapContainerBase markers={markers} />;
}
