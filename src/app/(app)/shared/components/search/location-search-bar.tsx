'use client';

import { MapPin } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { deleteCookie, setCookie } from 'cookies-next/client';

import {
  prevSearchLocationAtom,
  searchCoordinatesAtom,
  searchLocationAtom,
  searchLocationValidationErrorAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useLocations } from '../../hooks/api/use-locations';
import { useCallback, useState } from 'react';
import { cn } from '../../lib/utils';
import { Autocomplete } from '../ui/autocomplete';
import { DistanceSelect } from './distance-select';
import { UseMyLocationButton } from './use-my-location-button';
import { useSearchResources } from '../../hooks/use-search-resources';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
} from '../../lib/constants';
import { useAppConfig } from '../../hooks/use-app-config';

type LocationSearchBarProps = {
  className?: string;
  focusByDefault?: boolean;
};

export function LocationSearchBar({
  className,
  focusByDefault = false,
}: LocationSearchBarProps) {
  const appConfig = useAppConfig();

  const { t } = useTranslation();
  const [shouldSearch, setShouldSearch] = useState(false);
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

  const { setSearch } = useSearchResources();

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
        if ('country' in coords) {
          setCookie(USER_PREF_COUNTRY, coords.country, { path: '/' });
        }
        if ('district' in coords) {
          setCookie(USER_PREF_DISTRICT, coords.district, { path: '/' });
        }
        if ('place' in coords) {
          setCookie(USER_PREF_PLACE, coords.place, { path: '/' });
        }
        if ('postcode' in coords) {
          setCookie(USER_PREF_POSTCODE, coords.postcode, { path: '/' });
        }
        if ('region' in coords) {
          setCookie(USER_PREF_REGION, coords.region, { path: '/' });
        }
      } else {
        deleteCookie(USER_PREF_COORDS, { path: '/' });
        deleteCookie(USER_PREF_LOCATION, { path: '/' });
        deleteCookie(USER_PREF_COUNTRY, { path: '/' });
        deleteCookie(USER_PREF_DISTRICT, { path: '/' });
        deleteCookie(USER_PREF_PLACE, { path: '/' });
        deleteCookie(USER_PREF_POSTCODE, { path: '/' });
        deleteCookie(USER_PREF_REGION, { path: '/' });
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
    <div className="location-box flex flex-col gap-4">
      <Autocomplete
        className={cn(className, 'search-box')}
        inputProps={{
          autoFocus: focusByDefault,
          className: validationError ? '!border-red-500' : undefined,
          placeholder:
            appConfig.search.texts?.locationInputPlaceholder ||
            t('search.location_placeholder'),
        }}
        defaultOpen={focusByDefault}
        options={options}
        Icon={MapPin}
        onInputChange={handleInputChange}
        onValueChange={setSearchLocation}
        value={searchLocation}
        optionsPopoverClassName="max-h-[calc(100dvh-190px)] mt-[60px] sm:max-h-[calc(100dvh-310px)]"
        autoSelectIndex={coords?.length === 2 ? undefined : 1}
        autoSelectOnBlurIndex={1}
        blurOnOptionsInteraction
      />
      {validationError && (
        <p className="min-h-4 px-3 text-xs text-red-500">{validationError}</p>
      )}
      <div className="flex justify-between">
        <UseMyLocationButton />
        <DistanceSelect className="ml-auto" />
      </div>
    </div>
  );
}
