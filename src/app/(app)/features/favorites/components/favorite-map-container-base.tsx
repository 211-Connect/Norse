'use client';

import { useEffect, useState } from 'react';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { cn } from '@/app/(app)/shared/lib/utils';

type Marker = {
  id: string;
  coordinates?: [number, number];
};

type FavoriteMapContainerBaseProps = {
  markers: Marker[];
};

export function FavoriteMapContainerBase({
  markers,
}: FavoriteMapContainerBaseProps) {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);

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
        'sticky hidden h-full w-full p-2.5 lg:top-26.25 lg:block',
        appConfig.newLayout?.enabled && 'lg:top-36',
      )}
      style={{ height: `calc(100vh - ${headerHeight}px` }}
    >
      <div className="size-full overflow-hidden rounded-lg">
        <MapRenderer markers={markers} />
      </div>
    </div>
  );
}
