'use client';

import { MapRenderer } from '@/app/shared/components/map/map-renderer';
import { useWindowScroll } from '@/app/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/app/shared/lib/constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function MapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { t } = useTranslation('page-favorites');

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(y, 0), headerHeight) - headerHeight),
  );

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header!.clientHeight);
  }, [y]);

  if (headerHeight === 0) return null;

  return (
    <div
      className="sticky top-0 hidden h-full w-full p-[10px] lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <div className="absolute bottom-0 left-0 right-0 top-0 z-10 flex items-center justify-center bg-black bg-opacity-55">
          <p className="text-lg font-semibold text-white">
            {t('select_a_list')}
          </p>
        </div>
        <MapRenderer markers={[]} />
      </div>
    </div>
  );
}
