import { MapRenderer } from '@/shared/components/map/map-renderer';
import { useWindowScroll } from '@/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/shared/lib/constants';
import { favoriteListWithFavoritesAtom } from '@/shared/store/favorites';
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
    setHeaderHeight(header.clientHeight);
  }, [y]);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [clampedWindowValue]);

  return (
    <div
      className="sticky top-0 hidden h-full w-full p-[10px] lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <div className="size-full overflow-hidden rounded-lg">
        <MapRenderer markers={markers} />
      </div>
    </div>
  );
}
