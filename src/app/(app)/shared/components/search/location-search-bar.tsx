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
import { useCallback, useState, useContext } from 'react';
import { cn } from '../../lib/utils';
import { Autocomplete } from '../ui/autocomplete';
import { DistanceSelect } from './distance-select';
import { UseMyLocationButton } from './use-my-location-button';
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
import { MainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

type BaseProps = {
  className?: string;
  focusByDefault?: boolean;
  inputId?: string;
};

// Integrated mode - uses global atoms and context
type IntegratedModeProps = BaseProps & {
  mode?: 'integrated';
};

// Standalone mode - uses local state and callbacks
type StandaloneModeProps = BaseProps & {
  mode: 'standalone';
  onLocationChange: (location: string, coordinates: number[] | null) => void;
  initialValue?: string;
};

type LocationSearchBarProps = IntegratedModeProps | StandaloneModeProps;

export function LocationSearchBar(props: LocationSearchBarProps) {
  const { className, focusByDefault = false, inputId } = props;
  const mode = props.mode || 'integrated';
  const isStandalone = mode === 'standalone';

  const appConfig = useAppConfig();
  const { t } = useTranslation();
  const [shouldSearch, setShouldSearch] = useState(false);

  // Local state for standalone mode
  const [localSearchLocation, setLocalSearchLocation] = useState(
    isStandalone && 'initialValue' in props ? props.initialValue || '' : '',
  );
  const [localPrevSearchLocation, setLocalPrevSearchLocation] = useState('');

  // Global atoms for integrated mode
  const globalSearchLocation = useAtomValue(searchLocationAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const globalPrevSearchLocation = useAtomValue(prevSearchLocationAtom);

  // Select state based on mode
  const searchLocation = isStandalone
    ? localSearchLocation
    : globalSearchLocation;
  const prevSearchLocation = isStandalone
    ? localPrevSearchLocation
    : globalPrevSearchLocation;
  const debouncedSearchLocation = useDebounce(searchLocation, 1000);
  const {
    data: locations,
    options,
    additionalLocations,
  } = useLocations(
    shouldSearch ? debouncedSearchLocation : prevSearchLocation,
    isStandalone, // Exclude additional locations in standalone mode
  );
  const validationError = useAtomValue(searchLocationValidationErrorAtom);

  // Use context only if available (for main search integration)
  const context = useContext(MainSearchLayoutContext);
  const setSearch = context?.setSearch;

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

      if (isStandalone && 'onLocationChange' in props) {
        setLocalSearchLocation(value);
        props.onLocationChange(value, coords.coordinates || null);
      } else {
        setSearch?.((prev) => {
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
      }
    },
    [findCoords, setSearch, isStandalone, props],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setShouldSearch(true);

      if (isStandalone) {
        setLocalSearchLocation(value);
        setLocalPrevSearchLocation(value);
      } else {
        setSearch?.((prev) => ({
          ...prev,
          prevSearchLocation: value,
        }));
      }
    },
    [setSearch, isStandalone],
  );

  return (
    <div className="location-box flex flex-col gap-4">
      <Autocomplete
        className={cn(className, 'search-box')}
        inputProps={{
          autoFocus: focusByDefault,
          id: inputId,
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
        optionsPopoverClassName={`max-h-[calc(100dvh-190px)] ${isStandalone ? 'mt-[10px] sm:max-h-[calc(100dvh-250px)]' : 'mt-[60px] sm:max-h-[calc(100dvh-310px)]'}`}
        autoSelectIndex={coords?.length === 2 ? undefined : 1}
        autoSelectOnBlurIndex={1}
        blurOnOptionsInteraction
      />
      {validationError && (
        <p className="min-h-4 px-3 text-xs text-red-500">{validationError}</p>
      )}
      {!isStandalone && (
        <div className="flex justify-between">
          <UseMyLocationButton />
          <DistanceSelect className="ml-auto" />
        </div>
      )}
    </div>
  );
}
