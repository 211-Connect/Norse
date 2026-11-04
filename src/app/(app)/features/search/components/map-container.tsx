'use client';

import { type TFunction } from 'i18next';
import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { HEADER_ID } from '@/app/(app)/shared/lib/constants';
import {
  Coords,
  cn,
  distanceBetweenCoordsInMiles,
} from '@/app/(app)/shared/lib/utils';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { useSearchResults } from '../context/search-results-context';
import {
  type PinSite,
  type SearchPin,
  groupPinsBySite,
  omitPagePins,
} from '../utils/map-pins';
import { MapLegend } from './map-legend';
import { MapPopup, MapSitePopup } from './map-popup';

const toPin = (result: ResultType): SearchPin => ({
  id: result._id,
  resourceId: result.id,
  name: result.name,
  address: result.address,
  coordinates: result?.location?.coordinates as Coords | undefined,
});

const toMarker = (
  site: PinSite,
  userCoords: number[] | null | undefined,
  t: TFunction,
) => {
  const [first] = site;
  const { coordinates } = first;
  const distance =
    coordinates && userCoords?.length === 2
      ? distanceBetweenCoordsInMiles(userCoords as Coords, coordinates)
      : undefined;

  return site.length === 1
    ? {
        id: first.id,
        coordinates,
        label: first.name ?? undefined,
        popup: (
          <MapPopup
            distance={distance}
            id={first.resourceId ?? ''}
            name={first.name ?? ''}
            address={first.address} // TODO: Add Waiver
          />
        ),
      }
    : {
        id: first.id,
        coordinates,
        label: t('map_site_title', {
          count: site.length,
          defaultValue: '{{count}} resources at this location',
        }),
        count: site.length,
        popup: <MapSitePopup site={site} distance={distance} />,
      };
};

export function MapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);

  const { t } = useTranslation('page-search');
  const { results, pins } = useSearchResults();
  const coords = useAtomValue(userCoordinatesAtom);

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  const pagePins = useMemo(() => results.map(toPin), [results]);

  // Memoize to prevent unecessary map re-renders
  const mapMarkers = useMemo(
    () => (pins ? [] : pagePins.map((pin) => toMarker([pin], coords, t))),
    [coords, pagePins, pins, t],
  );

  const mapPoints = useMemo(
    () =>
      pins &&
      // Past the cap, the list's page may not be among the pins.
      groupPinsBySite([...omitPagePins(pins, pagePins), ...pagePins]).map(
        (site) => toMarker(site, coords, t),
      ),
    [coords, pagePins, pins, t],
  );

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
      <div className="relative h-full w-full rounded-lg">
        <MapRenderer markers={mapMarkers} points={mapPoints ?? undefined} />
        {mapPoints && <MapLegend showUserLocation={coords?.length === 2} />}
      </div>
    </div>
  );
}
