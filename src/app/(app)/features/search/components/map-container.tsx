'use client';

import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import {
  Coords,
  cn,
  distanceBetweenCoordsInMiles,
} from '@/app/(app)/shared/lib/utils';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { useSearchResults } from '../context/search-results-context';
import { MapPopup } from './map-popup';

/** The height of the pinned search bar and refine row on a phone. */
const PHONE_PINNED_HEIGHT = 104;

export function MapContainer({ phoneView = false }: { phoneView?: boolean }) {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  const { results } = useSearchResults();
  const coords = useAtomValue(userCoordinatesAtom);

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  // On a phone the map fills the screen under the pinned rows.
  useEffect(() => {
    if (!phoneView || !headerHeight || !mapRef.current) return;
    const { top } = mapRef.current.getBoundingClientRect();
    window.scrollTo(0, Math.max(top + window.scrollY - PHONE_PINNED_HEIGHT, 0));
  }, [phoneView, headerHeight]);

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
      ref={mapRef}
      data-testid="results-map"
      className={cn(
        'order-last h-[320px] w-full p-[10px] lg:sticky lg:top-[105px] lg:h-[var(--search-map-height)] lg:flex-1',
        appConfig.newLayout?.enabled && 'xl:top-[144px]',
        phoneView && 'max-md:h-[calc(100dvh-6.5rem)]',
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
