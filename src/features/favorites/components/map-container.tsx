import { MapRenderer } from '@/shared/components/map/map-renderer';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { HEADER_ID } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

export function MapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);
  const { t } = useTranslation('page-favorites');

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
