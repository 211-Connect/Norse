import { MapRenderer } from '@/shared/components/map/map-renderer';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { HEADER_ID } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/utils';
import { favoriteListWithFavoritesAtom } from '@/shared/store/favorites';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

export function FavoriteMapContainer() {
  const appConfig = useAppConfig();
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

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header.clientHeight);
  }, []);

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
