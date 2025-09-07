'use client';

import { MapPin } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  prevSearchLocationAtom,
  searchAtom,
  searchCoordinatesAtom,
  searchLocationAtom,
  searchLocationValidationErrorAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useLocations } from '../../hooks/api/use-locations';
import { cn } from '../../lib/utils';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '@/app/shared/lib/constants';
import { Autocomplete } from '../ui/autocomplete';
import { DistanceSelect } from './distance-select';
import { deleteCookie, setCookie } from 'cookies-next/client';

type LocationSearchBarProps = {
  className?: string;
};

export function LocationSearchBar({ className }: LocationSearchBarProps) {
  const [shouldSearch, setShouldSearch] = useState(false);
  const setSearch = useSetAtom(searchAtom);
  const searchLocation = useAtomValue(searchLocationAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const prevSearchLocation = useAtomValue(prevSearchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
  const {
    data: locations,
    options,
    additionalLocations,
  } = useLocations(shouldSearch ? debouncedSearchLocation : prevSearchLocation);
  const validationError = useAtomValue(searchLocationValidationErrorAtom);

  const { t } = useTranslation();

  const findCoords = useCallback(
    (value: string) => {
      const location = locations.find(
        (loc) => loc.address.toLowerCase() === value.toLowerCase(),
      );

      if (location) return location;

      const additionalLocation = additionalLocations.find(
        (loc) => loc.address.toLowerCase() === value.toLowerCase(),
      );

      if (additionalLocation) return additionalLocation;

      return {
        type: 'invalid',
        coordinates: null,
      };
    },
    [locations, additionalLocations],
  );

  const setSearchLocation = useCallback(
    (value) => {
      const coords = findCoords(value);

      // We only want to update the user pref cookie for location
      // IF coordinates are found for a given query.
      //
      // This is to prevent the caching of invalid locations
      // We also update the 2 values so that they are empty if coordinates are not found
      if (coords.type === 'coordinates') {
        setCookie(USER_PREF_COORDS, coords.coordinates?.join(','), {
          path: '/',
        });
        setCookie(USER_PREF_LOCATION, value, { path: '/' });
      } else {
        deleteCookie(USER_PREF_COORDS, { path: '/' });
        deleteCookie(USER_PREF_LOCATION, { path: '/' });
      }

      setShouldSearch(false);

      setSearch((prev) => {
        // Ensure we are only providing updated coordinates to prevent unnecessary rerenders
        let isNewCoords = false;
        const coordinates = coords.coordinates;
        if (
          coords.type === 'invalid' ||
          (coords.type === 'coordinates' &&
            coordinates?.[0] !== prev['userCoordinates']?.[0] &&
            coordinates?.[1] !== prev['userCoordinates']?.[1]) ||
          (coordinates?.[0] !== prev['userCoordinates']?.[0] &&
            coordinates?.[1] !== prev['userCoordinates']?.[1])
        ) {
          isNewCoords = true;
        }

        return {
          ...prev,
          ...(isNewCoords ? { searchCoordinates: coordinates ?? [] } : {}),
          searchLocation: value,
          searchLocationValidationError: '',
        };
      });
    },
    [findCoords, setSearch],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setShouldSearch(true);

      setSearch((prev) => ({
        ...prev,
        prevSearchLocation: value,
      }));
    },
    [setSearch],
  );

  return (
    <div className="location-box">
      <div
        className={cn(
          'flex w-full flex-1 items-center justify-stretch border-b',
          className,
        )}
      >
        <Autocomplete
          className={cn(
            className,
            'search-box',
            validationError && 'border-b border-b-red-500',
            'flex-1 border-none',
          )}
          inputProps={{
            placeholder:
              t('search.location_placeholder', {
                ns: 'dynamic',
                defaultValue: t('search.location_placeholder'),
              }) || '',
          }}
          options={options}
          Icon={MapPin}
          onInputChange={handleInputChange}
          onValueChange={setSearchLocation}
          value={searchLocation}
          autoSelectIndex={coords?.length === 2 ? undefined : 1}
        />

        <DistanceSelect />
      </div>
      <p className="min-h-4 px-3 text-xs text-red-500">{validationError}</p>
    </div>
  );
}
