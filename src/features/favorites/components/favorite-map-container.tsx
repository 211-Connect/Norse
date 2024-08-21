import { MapLoader } from '@/shared/components/map/map-loader';
import { useWindowScroll } from '@/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/shared/lib/constants';
import { useEffect, useState } from 'react';

export function FavoriteMapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);

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
      className="sticky top-0 hidden h-full w-full lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <MapLoader markers={[]} />
    </div>
  );
}
