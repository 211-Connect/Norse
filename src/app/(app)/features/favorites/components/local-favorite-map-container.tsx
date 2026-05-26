'use client';

import { useMemo } from 'react';

import { Resource } from '@/types/resource';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { FavoriteMapContainerBase } from './favorite-map-container-base';

type LocalFavoriteMapContainerProps = {
  resources: Resource[];
};

export function LocalFavoriteMapContainer({
  resources,
}: LocalFavoriteMapContainerProps) {
  const markers = useMemo(() => {
    return resources.map((resource) => {
      const coords = resource.location?.coordinates;
      return {
        id: resource.id,
        coordinates: isValidCoordinate(coords) ? coords : undefined,
      };
    });
  }, [resources]);

  return <FavoriteMapContainerBase markers={markers} />;
}
