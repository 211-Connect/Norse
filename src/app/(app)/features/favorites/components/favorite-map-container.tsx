'use client';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { cn } from '@/app/(app)/shared/lib/utils';
import { isValidCoordinate } from '@/utils/isValidCoordinate';
import { favoriteListWithFavoritesAtom } from '@/app/(app)/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

export function FavoriteMapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);
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

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  if (headerHeight === 0) return null;

  return (
    <div
      className={cn(
        'sticky hidden h-full w-full p-[10px] lg:top-[105px] lg:block',
        appConfig.newLayout?.enabled && 'lg:top-[144px]',
      )}
      style={{ height: `calc(100vh - ${headerHeight}px` }}
    >
      <div className="size-full overflow-hidden rounded-lg">
        <MapRenderer markers={markers} />
      </div>
    </div>
  );
}
