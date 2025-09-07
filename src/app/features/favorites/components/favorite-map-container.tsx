'use client';

import { MapRenderer } from '@/app/shared/components/map/map-renderer';
import { useWindowScroll } from '@/app/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/app/shared/lib/constants';
import { favoriteListWithFavoritesAtom } from '@/app/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

export function FavoriteMapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);
  const favoriteList = useAtomValue(favoriteListWithFavoritesAtom);

  const markers = useMemo(() => {
    return (
      favoriteList?.favorites?.map((favorite) => ({
        id: favorite._id,
        coordinates: favorite.location.coordinates,
      })) ?? []
    );
  }, [favoriteList.favorites]);

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(y, 0), headerHeight) - headerHeight),
  );

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header!.clientHeight);
  }, [y]);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [clampedWindowValue]);

  if (headerHeight === 0) return null;

  return (
    <div
      className="sticky top-0 hidden h-full w-full lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <MapRenderer markers={markers} />
    </div>
  );
}
