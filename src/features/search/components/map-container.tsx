'use client';
import { SearchResultResponse } from '@/lib/server/fetch-search-results';
import { MapRenderer } from '@/shared/components/map/map-renderer';
import { useWindowScroll } from '@/shared/hooks/use-window-scroll';
import { HEADER_ID } from '@/shared/lib/constants';
import { useEffect, useMemo, useState } from 'react';

type MapContainerProps = {
  results: SearchResultResponse['results'];
};

export function MapContainer({ results }: MapContainerProps) {
  const [_, y] = useWindowScroll();
  const [headerHeight, setHeaderHeight] = useState(0);

  const clampedWindowValue = Math.round(
    Math.abs(Math.min(Math.max(y, 0), headerHeight) - headerHeight),
  );

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    setHeaderHeight(header?.clientHeight ?? 0);
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

  return (
    <div
      className="sticky top-0 hidden h-full w-full lg:block"
      style={{ height: `calc(100vh - ${clampedWindowValue}px` }}
    >
      <MapRenderer markers={mapMarkers} />
    </div>
  );
}
