import { useTranslation } from 'next-i18next';
import { MapPin, NavigationIcon } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  prevSearchLocationAtom,
  searchAtom,
  searchLocationAtom,
  searchLocationValidationErrorAtom,
} from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useLocations } from '../../hooks/api/use-locations';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { destroyCookie, setCookie } from 'nookies';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/shared/lib/constants';
import { Autocomplete } from '../ui/autocomplete';

type LocationSearchBarProps = {
  className?: string;
};

export function LocationSearchBar({ className }: LocationSearchBarProps) {
  const { t } = useTranslation();
  const [shouldSearch, setShouldSearch] = useState(false);
  const setSearch = useSetAtom(searchAtom);
  const searchLocation = useAtomValue(searchLocationAtom);
  const prevSearchLocation = useAtomValue(prevSearchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
  const { data: locations } = useLocations(
    shouldSearch ? debouncedSearchLocation : prevSearchLocation,
  );
  const validationError = useAtomValue(searchLocationValidationErrorAtom);

  const additionalLocations = useMemo(
    () => [
      {
        type: 'coordinates',
        address: t('search.everywhere', 'Everywhere'),
        coordinates: [],
      },
    ],
    [t],
  );

  const options = useMemo(() => {
    return [
      ...additionalLocations.map((loc) => ({
        value: loc.address,
        icon: NavigationIcon,
      })),
      ...locations.map((loc) => ({
        value: loc.address,
        icon: NavigationIcon,
      })),
    ];
  }, [locations, additionalLocations]);

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
    [additionalLocations, locations],
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
        setCookie(null, USER_PREF_COORDS, coords.coordinates.join(','), {
          path: '/',
        });
        setCookie(null, USER_PREF_LOCATION, value, { path: '/' });
      } else {
        destroyCookie(null, USER_PREF_COORDS, { path: '/' });
        destroyCookie(null, USER_PREF_LOCATION, { path: '/' });
      }

      setShouldSearch(false);

      setSearch((prev) => {
        // Ensure we are only providing updated coordinates to prevent unnecessary rerenders
        let isNewCoords = false;
        const coordinates = coords.coordinates;
        if (
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
          ...(isNewCoords ? { userCoordinates: coordinates } : {}),
          searchLocation: value,
          userLocation: value,
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
    <div className="w-full">
      <Autocomplete
        className={cn(
          className,
          'search-box',
          validationError && 'border-b border-b-red-500',
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
        autoSelectIndex={1}
      />

      <p className="min-h-4 text-xs text-red-500">{validationError}</p>
    </div>
  );
}
