'use client';

import { useAtomValue } from 'jotai';
import { MapPin } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';

import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { MainSearchLayoutContext } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout-context';
import {
  LocationCookieSnapshot,
  restoreLocationCookies,
  snapshotLocationCookies,
} from '@/app/(app)/shared/lib/location-cookies';
import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';
import { cn } from '@/app/(app)/shared/lib/utils';
import {
  searchCoordinatesAtom,
  searchLocationAtom,
  searchRegionAtom,
} from '@/app/(app)/shared/store/search';

import {
  CLEAR_LOCATION_CHANGES,
  isPickedPlace,
  landingLocationLabel,
  locationChanges,
  PlaceBeforeChange,
  restorePlace,
} from '../v2/landing';
import { useV2Navigate } from '../v2/use-v2-search';

const INPUT_ID = 'landing-location-input';
const BUTTON =
  'text-primary flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-2 text-sm font-semibold';

/**
 * Prototype: the landing page shows the place the search uses, with Change. With no
 * place it renders nothing: the guide's own location step asks when it needs one.
 */
export function LandingLocation() {
  const searchLocation = useAtomValue(searchLocationAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const searchRegion = useAtomValue(searchRegionAtom);
  const { write } = useV2Navigate();
  const [changing, setChanging] = useState(false);
  const label = landingLocationLabel(searchLocation);
  const lastLocation = useRef(searchLocation);
  const setSearch = useContext(MainSearchLayoutContext)?.setSearch;
  // The place shown when Change was tapped. The box edits the shared search state as the person
  // types or taps x, so Cancel puts this back: only a new pick replaces the place (Lucas, 2026-11-20).
  const before = useRef<
    (PlaceBeforeChange & { cookies: LocationCookieSnapshot }) | null
  >(null);

  const startChange = () => {
    before.current = {
      location: searchLocation,
      coordinates: searchCoordinates,
      region: searchRegion,
      cookies: snapshotLocationCookies(),
    };
    setChanging(true);
  };

  // Cancel closes the box first and puts the place back after: removing the focused box fires a
  // blur, and the box's blur auto-pick would otherwise overwrite the restored place.
  const restoreAfterClose = useRef<typeof before.current>(null);
  const cancelChange = () => {
    restoreAfterClose.current = before.current;
    before.current = null;
    setChanging(false);
  };

  // A place picked in the box writes to the URL, so the questions and results follow it.
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (!changing) return;
    if (isEverywhereLocation(searchLocation)) {
      write(CLEAR_LOCATION_CHANGES);
      setChanging(false);
    } else if (isPickedPlace(searchCoordinates, searchRegion)) {
      // Typing over the old place also changes searchLocation (LocationSearchBar's decommit writes the
      // typed letters with no coordinates), so only a real pick, with a point or an area, is written.
      write(locationChanges(searchLocation, searchCoordinates, searchRegion));
      setChanging(false);
    }
  }, [searchLocation]);

  useEffect(() => {
    if (changing) {
      document.getElementById(INPUT_ID)?.focus();
      return;
    }
    const saved = restoreAfterClose.current;
    restoreAfterClose.current = null;
    if (!saved) return;
    restoreLocationCookies(saved.cookies);
    setSearch?.((prev) => restorePlace(prev, saved));
  }, [changing]);

  if (!label && !changing) return null;

  if (changing) {
    return (
      <div
        // Top-aligned: the place list opens in the flow under the box, and Cancel stays on the
        // box's line (its 44 px tap area centered on the 34 px box).
        className="flex w-full items-start gap-2 pt-2"
        data-testid="landing-location"
      >
        <div className="min-w-0 flex-1">
          <LocationSearchBar
            inputId={INPUT_ID}
            className="w-full"
            listClassName="z-30 rounded-md border border-gray-300 shadow-lg"
            myLocationInline
            anchorList="input"
            commitAfterLoad
            rankEverywhere
          />
        </div>
        <button
          type="button"
          className={cn(BUTTON, '-mt-[5px]')}
          data-testid="landing-location-cancel"
          // Leaving the box auto-picks the top match; Cancel must not pick (tap, click or Tab).
          data-skip-blur-pick
          onClick={cancelChange}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex w-full items-center gap-1 pt-2 text-sm"
      data-testid="landing-location"
    >
      <MapPin className="text-primary size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate" title={label ?? undefined}>
        Near {label}
      </span>
      <button
        type="button"
        className={BUTTON}
        aria-label={`Change location: ${label}`}
        data-testid="landing-location-change"
        onClick={startChange}
      >
        Change
      </button>
    </div>
  );
}
