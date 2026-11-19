'use client';

import { type TFunction } from 'i18next';
import { useAtomValue } from 'jotai';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
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
  formatAddressForDisplay,
} from '@/app/(app)/shared/lib/utils';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { useSearchResults } from '../context/search-results-context';
import { useV2Pins } from '../v2/use-v2-pins';
import {
  type PinSite,
  type SearchPin,
  groupPinsBySite,
  omitPagePins,
} from '../utils/map-pins';
import { useRegionArea } from '../hooks/useRegionArea';
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

/** The height of the pinned search bar and refine row on a phone. */
const PHONE_PINNED_HEIGHT = 104;

export function MapContainer({ phoneView = false }: { phoneView?: boolean }) {
  const appConfig = useAppConfig();
  const [headerHeight, setHeaderHeight] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  const { t, i18n } = useTranslation('page-search');
  const { results, totalResults, pinsQuery, region } = useSearchResults();
  const regionArea = useRegionArea(region, i18n.language);
  const searchArea = regionArea?.geometry;
  // When the page holds every result, the pins could add nothing to it.
  const isWholeSearchOnPage = totalResults <= results.length;
  const { pins, isLoading: isLoadingPins } = useSearchPins(
    isWholeSearchOnPage ? null : pinsQuery,
  );
  const coords = useAtomValue(userCoordinatesAtom);
  // The map shows every located match of the search (`/v2/search/pins`), not only the list's page.
  const { pins: v2Pins } = useV2Pins();

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

  const pagePins = useMemo(() => results.map(toPin), [results]);

  // Memoize to prevent unecessary map re-renders. The v2 pins (`/v2/search/pins`) cover every
  // located match of the search; without them the map shows the list's current page.
  const pageMarkers = useMemo(() => {
    if (v2Pins?.length) {
      const byId = new Map(results.map((r) => [r._id, r]));
      return v2Pins.map((pin) => {
        const hit = byId.get(pin.id);
        const distance =
          (coords?.length ?? 0) === 2
            ? distanceBetweenCoordsInMiles(coords as Coords, pin.coordinates)
            : undefined;
        const name = pin.name ?? hit?.name ?? '';
        const linkId = pin.service_at_location_id ?? hit?.id ?? pin.id;
        return {
          id: pin.id,
          coordinates: pin.coordinates,
          label: name,
          popup: (
            <MapPopup
              distance={distance}
              id={linkId}
              name={name}
              address={formatAddressForDisplay(pin.physical_address) || hit?.address}
            />
          ),
        };
      });
    }
    return pagePins.map((pin) => toMarker([pin], coords, t));
  }, [coords, pagePins, results, t, v2Pins]);

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
              <MapRenderer
                markers={pageMarkers}
                searchArea={searchArea}
                hideUserLocation={Boolean(region)}
              />
            </ErrorBoundary>
          }
        >
          <MapRenderer
            markers={mapMarkers}
            points={mapPoints ?? undefined}
            searchArea={searchArea}
            hideUserLocation={Boolean(region)}
          />
          {((mapPoints && mapPoints.length > 0) || regionArea) && (
            <MapLegend
              rows={legendRows}
              showUserLocation={
                Boolean(mapPoints?.length) && coords?.length === 2 && !region
              }
              isLoadingPins={isLoadingPins}
              searchAreaName={regionArea?.name}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
