'use client';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { cn } from '@/app/(app)/shared/lib/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function MapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { t } = useTranslation('page-favorites');

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
