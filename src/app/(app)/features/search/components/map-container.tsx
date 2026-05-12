'use client';

import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useMemo, useState } from 'react';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import {
  Coords,
  cn,
  distanceBetweenCoordsInMiles,
} from '@/app/(app)/shared/lib/utils';
import { resultsAtom } from '@/app/(app)/shared/store/results';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';

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

        return distanceBetweenCoordsInMiles(
          coords as Coords,
          coordinates as Coords,
        );
      })();

      return {
        id: result._id,
        coordinates,
        label: result.name,
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
        'order-last h-[320px] w-full p-[10px] lg:sticky lg:top-[105px] lg:h-[var(--search-map-height)] lg:flex-1',
        appConfig.newLayout?.enabled && 'xl:top-[144px]',
      )}
      style={
        {
          '--search-map-height': `calc(100vh - ${headerHeight}px)`,
        } as CSSProperties
      }
    >
      <div className="h-full w-full rounded-lg">
        <MapRenderer markers={mapMarkers} />
      </div>
    </div>
  );
}
