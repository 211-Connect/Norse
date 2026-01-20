'use client';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import { resultsAtom } from '@/app/(app)/shared/store/results';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import {
  cn,
  Coords,
  distanceBetweenCoordsInKm,
} from '@/app/(app)/shared/lib/utils';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { MapPopup } from './map-popup';

export function MapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);

  const results = useAtomValue(resultsAtom);
  const coords = useAtomValue(userCoordinatesAtom);

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  // Memoize to prevent unecessary map re-renders
  const mapMarkers = useMemo(() => {
    return results.map((result) => {
      const coordinates = result?.location?.coordinates as Coords | undefined;
      const distance = (() => {
        if (!coordinates || (coords?.length ?? 0) !== 2) {
          return undefined;
        }

        return distanceBetweenCoordsInKm(
          coords as Coords,
          coordinates as Coords,
        );
      })();

      return {
        id: result._id,
        coordinates,
        popup: (
          <MapPopup
            distance={distance}
            id={result.id}
            name={result.name}
            address={result.address} // TODO: Add Waiver
          />
        ),
      };
    });
  }, [coords, results]);

  if (headerHeight === 0) return null;

  return (
    <div
      className={cn(
        'sticky top-[105px] hidden h-full w-full flex-1 p-[10px] lg:block',
        appConfig.newLayout?.enabled && 'xl:top-[144px]',
      )}
      style={{ height: `calc(100vh - ${headerHeight}px` }}
    >
      <div className="h-full w-full overflow-hidden rounded-lg">
        <MapRenderer markers={mapMarkers} />
      </div>
    </div>
  );
}
