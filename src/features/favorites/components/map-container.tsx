import { MapLoader } from '@/shared/components/map/map-loader';
import { useWindowScroll } from '@/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/shared/lib/constants';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

export function MapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { t } = useTranslation('page-favorites');

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
      <div className="absolute bottom-0 left-0 right-0 top-0 z-10 flex items-center justify-center bg-black bg-opacity-55">
        <p className="text-lg font-semibold text-white">{t('select_a_list')}</p>
      </div>
      <MapLoader markers={[]} />
    </div>
  );
}
