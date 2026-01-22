import { useTranslation } from 'next-i18next';
import { MapPin } from 'lucide-react';
import { useAtomValue } from 'jotai';
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
import { destroyCookie, setCookie } from 'nookies';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
  USER_PREF_DISTANCE,
} from '@/shared/lib/constants';
import { Autocomplete } from '../ui/autocomplete';
import { DistanceSelect } from './distance-select';
import { UseMyLocationButton } from './use-my-location-button';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
import { determineGeoStrategy } from '@/shared/lib/advanced-geolocation';

type LocationSearchBarProps = {
  className?: string;
  focusByDefault?: boolean;
  inputId?: string;
};

export function LocationSearchBar({
  className,
  focusByDefault = false,
  inputId,
}: LocationSearchBarProps) {
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

  const { setSearch } = useMainSearchLayoutContext();

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
      const coords: any = findCoords(value);

      // We only want to update the user pref cookie for location
      // IF coordinates are found for a given query.
      //
      // This is to prevent the caching of invalid locations
      // We also update the 2 values so that they are empty if coordinates are not found
      if (coords.type === 'coordinates') {
        setCookie(null, USER_PREF_COORDS, coords.coordinates.join(','), {
          path: '/',
        });
        setCookie(null, USER_PREF_LOCATION, value, { path: '/' });
        if ('country' in coords) {
          setCookie(null, USER_PREF_COUNTRY, coords.country, { path: '/' });
        }
        if ('district' in coords) {
          setCookie(null, USER_PREF_DISTRICT, coords.district, { path: '/' });
        }
        if ('place' in coords) {
          setCookie(null, USER_PREF_PLACE, coords.place, { path: '/' });
        }
        if ('postcode' in coords) {
          setCookie(null, USER_PREF_POSTCODE, coords.postcode, { path: '/' });
        }
        if ('region' in coords) {
          setCookie(null, USER_PREF_REGION, coords.region, { path: '/' });
        }
      } else {
        destroyCookie(null, USER_PREF_COORDS, { path: '/' });
        destroyCookie(null, USER_PREF_LOCATION, { path: '/' });
        destroyCookie(null, USER_PREF_COUNTRY, { path: '/' });
        destroyCookie(null, USER_PREF_DISTRICT, { path: '/' });
        destroyCookie(null, USER_PREF_PLACE, { path: '/' });
        destroyCookie(null, USER_PREF_POSTCODE, { path: '/' });
        destroyCookie(null, USER_PREF_REGION, { path: '/' });
        destroyCookie(null, USER_PREF_DISTANCE, { path: '/' });
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

        // Strategy Resolution
        let newDist = prev['searchDistance'];
        let newBbox = prev['searchBbox'] || [];
        let newGeoType = prev['searchGeoType'] || 'radius';

        // Check if the user has manually set a distance (and it's not the '0' default)
        const isDefaultDistance = !prev['searchDistance'] || prev['searchDistance'] === '0';
        console.log('[LocationSearchBar] isDefaultDistance:', isDefaultDistance, 'prevDistance:', prev['searchDistance']);

        if (coords.type === 'coordinates') {
           // If user has a specific distance set (and it's not the default), we honor that as a RADIUS search
           if (!isDefaultDistance) {
             newGeoType = 'radius';
             // newDist remains as the user's manual selection
             newBbox = []; 
           } else {
             // Use advanced strategy to decide based on location type
             const feature = coords as unknown as import('@/shared/lib/advanced-geolocation').MapboxFeature;
             console.log('[LocationSearchBar] determining strategy for feature:', feature);
             const strategy = determineGeoStrategy(feature);
             console.log('[LocationSearchBar] strategy determined:', strategy);

             if (strategy.type === 'bbox') {
                newGeoType = 'bbox';
                newBbox = strategy.bbox;
                newDist = ''; // Clear distance for bbox search
                // Clear distance cookie as we are now in bbox mode
                destroyCookie(null, USER_PREF_DISTANCE, { path: '/' });
             } else {
                newGeoType = 'radius';
                newDist = strategy.radius.toString();
                newBbox = [];
                // Set distance cookie for persistence
                setCookie(null, USER_PREF_DISTANCE, newDist, { path: '/' });
             }
           }
        }

        return {
          ...prev,
          ...(isNewCoords ? { searchCoordinates: coordinates } : {}),
          searchLocation: value,
          searchLocationValidationError: '',
          searchDistance: newDist,
          searchBbox: newBbox,
          searchGeoType: newGeoType,
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
          id: inputId,
          className: validationError ? '!border-red-500' : undefined,
          placeholder:
            t('search.location_placeholder', {
              ns: 'dynamic',
              defaultValue: t('search.location_placeholder'),
            }) || '',
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
