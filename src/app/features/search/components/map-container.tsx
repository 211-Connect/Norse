'use client';

import { MapRenderer } from '@/app/shared/components/map/map-renderer';
import { useWindowScroll } from '@/app/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/app/shared/lib/constants';
import { resultsAtom } from '@/app/shared/store/results';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { userCoordinatesAtom } from '@/app/shared/store/search';
import { distanceBetweenCoordsInKm } from '@/app/shared/lib/utils';

import { MapPopup } from './map-popup';

export function MapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);

  const results = useAtomValue(resultsAtom);
  const coords = useAtomValue(userCoordinatesAtom);

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(y, 0), headerHeight) - headerHeight),
  );

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header!.clientHeight);
  }, [y]);

  // Memoize to prevent unecessary map re-renders
  const mapMarkers = useMemo(() => {
    return results.map((result) => {
      const coordinates = result?.location?.coordinates;
      const distance = (() => {
        if (!coordinates || (coords?.length ?? 0) !== 2) {
          return undefined;
        }

        return distanceBetweenCoordsInKm(
          coords as [number, number],
          coordinates,
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
      className="sticky top-0 hidden h-full w-full flex-1 p-[10px] lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <div className="h-full w-full overflow-hidden rounded-lg">
        <MapRenderer markers={mapMarkers} />
      </div>
    </div>
  );
}
