'use client';

import { MapRenderer } from '@/app/shared/components/map/map-renderer';
import { useWindowScroll } from '@/app/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/app/shared/lib/constants';
import { resultsAtom } from '@/app/shared/store/results';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

export function MapContainer() {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);
  const results = useAtomValue(resultsAtom);

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(y, 0), headerHeight) - headerHeight),
  );

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header!.clientHeight);
  }, [y]);

  // Memoize to prevent unecessary map re-renders
  const mapMarkers = useMemo(() => {
    return results.map((result) => ({
      id: result._id,
      coordinates: result?.location?.coordinates,
      popup: (
        <>
          <h3 className="font-bold">{result.name}</h3>
        </>
      ),
    }));
  }, [results]);

  if (headerHeight === 0) return null;

  return (
    <div
      className="sticky top-0 hidden h-full w-full lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <MapRenderer markers={mapMarkers} />
    </div>
  );
}
