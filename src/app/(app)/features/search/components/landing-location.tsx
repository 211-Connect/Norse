'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { clearLocationCookies } from '@/app/(app)/shared/lib/location-cookies';
import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';
import {
  searchAtom,
  searchCoordinatesAtom,
  searchLocationAtom,
  searchRegionAtom,
} from '@/app/(app)/shared/store/search';

import {
  CLEAR_LOCATION_CHANGES,
  isPickedPlace,
  landingLocationLabel,
  locationChanges,
} from '../v2/landing';
import { useV2Navigate } from '../v2/use-v2-search';

const INPUT_ID = 'landing-location-input';
const BUTTON =
  'text-primary flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-2 text-sm font-semibold';

/**
 * Prototype: the landing page shows the place the search uses, with Change and Clear. With no
 * place it renders nothing: the guide's own location step asks when it needs one.
 */
export function LandingLocation() {
  const searchLocation = useAtomValue(searchLocationAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const searchRegion = useAtomValue(searchRegionAtom);
  const setSearch = useSetAtom(searchAtom);
  const { write } = useV2Navigate();
  const [changing, setChanging] = useState(false);
  const label = landingLocationLabel(searchLocation);
  const lastLocation = useRef(searchLocation);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  useEffect(() => {
    if (changing) document.getElementById(INPUT_ID)?.focus();
  }, [changing]);

  const clear = () => {
    clearLocationCookies();
    setSearch((prev) => ({
      ...prev,
      searchLocation: '',
      prevSearchLocation: '',
      searchCoordinates: [],
      searchRegion: '',
    }));
    write(CLEAR_LOCATION_CHANGES, 'replace');
  };

  if (!label && !changing) return null;

  if (changing) {
    return (
      <div
        className="flex w-full items-center gap-2 pt-2"
        data-testid="landing-location"
      >
        <div className="min-w-0 flex-1">
          <LocationSearchBar inputId={INPUT_ID} className="w-full" />
        </div>
        <button
          type="button"
          className={BUTTON}
          onClick={() => setChanging(false)}
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
        onClick={() => setChanging(true)}
      >
        Change
      </button>
      <button
        type="button"
        className={BUTTON}
        aria-label="Clear location"
        data-testid="landing-location-clear"
        onClick={clear}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
