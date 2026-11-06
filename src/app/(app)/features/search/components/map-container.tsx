'use client';

import { type TFunction } from 'i18next';
import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorBoundary } from '@/app/(app)/features/error/components/error-boundary';
import { MapErrorFallback } from '@/app/(app)/shared/components/map/map-error-fallback';
import { type MarkerDef } from '@/app/(app)/shared/components/map/map-shared';
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
import { useSearchPins } from '../hooks/useSearchPins';
import { MapLegend } from './map-legend';
import { MapPopup, MapSitePopup } from './map-popup';

const NO_PINS: SearchPin[] = [];

const toPin = (result: ResultType): SearchPin => ({
  id: result._id,
  resourceId: result.id,
  name: result.name,
  address: result.address,
  coordinates: result?.location?.coordinates as Coords | undefined,
});

/**
 * A site's marker. Its popup is built when it opens (`getPopup`) for circles,
 * which can be 10,000, and up front (`popup`) for the page's few pins.
 */
const toMarker = (
  site: PinSite,
  userCoords: number[] | null | undefined,
  t: TFunction,
  {
    listIds,
    isLazy = false,
  }: {
    /** Ids of the list's current page, which a shared address's popup marks. */
    listIds?: ReadonlySet<string>;
    isLazy?: boolean;
  } = {},
): MarkerDef => {
  const [first] = site;
  const { coordinates } = first;

  const buildPopup = () => {
    const distance =
      coordinates && userCoords?.length === 2
        ? distanceBetweenCoordsInMiles(userCoords as Coords, coordinates)
        : undefined;

    return site.length === 1 ? (
      <MapPopup
        distance={distance}
        id={first.resourceId ?? ''}
        name={first.name ?? ''}
        address={first.address} // TODO: Add Waiver
      />
    ) : (
      <MapSitePopup site={site} distance={distance} listIds={listIds} />
    );
  };

  return {
    id: first.id,
    coordinates,
    label:
      site.length === 1
        ? (first.name ?? undefined)
        : t('map_site_title', {
            count: site.length,
            defaultValue: '{{count}} resources at this location',
          }),
    ...(site.length > 1 && { count: site.length }),
    ...(isLazy ? { getPopup: buildPopup } : { popup: buildPopup() }),
  };
};

export function MapContainer() {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);

  const { t } = useTranslation('page-search');
  const { results, totalResults, pinsQuery } = useSearchResults();
  // When the page holds every result, the pins could add nothing to it.
  const isWholeSearchOnPage = totalResults <= results.length;
  const { pins, isLoading: isLoadingPins } = useSearchPins(
    isWholeSearchOnPage ? null : pinsQuery,
  );
  const coords = useAtomValue(userCoordinatesAtom);

  useEffect(() => {
    const header = document.getElementById(HEADER_ID);
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  const pagePins = useMemo(() => results.map(toPin), [results]);

  // Memoize to prevent unecessary map re-renders
  const pageMarkers = useMemo(
    () => pagePins.map((pin) => toMarker([pin], coords, t)),
    [coords, pagePins, t],
  );

  // With the flag on, the page's results are circles from the first render;
  // the rest of the search joins them once its pins arrive.
  const mapPoints = useMemo(() => {
    if (!pinsQuery) return null;

    const onPage = new Set(pagePins.map((pin) => pin.id));

    // The page comes first, so a shared address is known by a result in the list.
    return groupPinsBySite([
      ...pagePins,
      ...omitPagePins(pins ?? NO_PINS, pagePins),
    ]).map((site) => ({
      ...toMarker(site, coords, t, { listIds: onPage, isLazy: true }),
      inList: onPage.has(site[0].id),
    }));
  }, [coords, pagePins, pins, pinsQuery, t]);

  // The legend explains only what the map shows.
  const legendRows = useMemo(
    () => ({
      inList: mapPoints?.some((point) => point.inList) ?? false,
      other: mapPoints?.some((point) => !point.inList) ?? false,
      site: mapPoints?.some((point) => (point.count ?? 1) > 1) ?? false,
    }),
    [mapPoints],
  );

  // With circles, the markers are only how a keyboard reaches the list's circles.
  const mapMarkers = useMemo(
    () => mapPoints?.filter((point) => point.inList) ?? pageMarkers,
    [mapPoints, pageMarkers],
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
        {/* A map that fails never costs the reader the list. It first drops
            what the flag added, then falls back to a message. */}
        <ErrorBoundary
          appConfig={appConfig}
          resetKey={results}
          fallback={
            <ErrorBoundary
              appConfig={appConfig}
              resetKey={results}
              fallback={<MapErrorFallback error="Failed to load map" />}
            >
              <MapRenderer markers={pageMarkers} />
            </ErrorBoundary>
          }
        >
          <MapRenderer markers={mapMarkers} points={mapPoints ?? undefined} />
          {mapPoints && mapPoints.length > 0 && (
            <MapLegend
              rows={legendRows}
              showUserLocation={coords?.length === 2}
              isLoadingPins={isLoadingPins}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
