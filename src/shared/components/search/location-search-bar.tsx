import { useTranslation } from 'next-i18next';
import { MapPin } from 'lucide-react';
import { Autocomplete } from '../autocomplete';
import { useAtomValue, useSetAtom } from 'jotai';
import { searchAtom, searchLocationAtom } from '../../store/search';
import { useDebounce } from '../../hooks/use-debounce';
import { useLocations } from '../../hooks/api/use-locations';
import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { setCookie } from 'nookies';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/shared/lib/constants';

export function LocationSearchBar({ className }) {
  const { t } = useTranslation();
  const setSearch = useSetAtom(searchAtom);
  const searchLocation = useAtomValue(searchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
  const { data: locations } = useLocations(debouncedSearchLocation);

  const options = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.address,
    }));
  }, [locations]);

  const findCoords = (value: string) => {
    const location = locations.find(
      (loc) => loc.address.toLowerCase() === value.toLowerCase(),
    );

    if (location) return location['coordinates'];

    return [];
  };

  const setSearchLocation = async (value) => {
    const coords = findCoords(value);

    // We only want to update the user pref cookie for location
    // IF coordinates are found for a given query.
    //
    // This is to prevent the caching of invalid locations
    // We also update the 2 valeus so that they are empty if coordinates are not found
    if (coords?.length === 2) {
      setCookie(null, USER_PREF_COORDS, coords.join(','), { path: '/' });
      setCookie(null, USER_PREF_LOCATION, value, { path: '/' });
    } else {
      setCookie(null, USER_PREF_COORDS, '', { path: '/' });
      setCookie(null, USER_PREF_LOCATION, '', { path: '/' });
    }

    setSearch((prev) => ({
      ...prev,
      searchLocation: value,
      userLocation: value,
      userCoordinates: coords,
    }));
  };

  return (
    <Autocomplete
      className={cn(className, 'search-box')}
      placeholder={
        t('search.location_placeholder', {
          ns: 'dynamic',
          defaultValue: t('search.location_placeholder'),
        }) || ''
      }
      options={options}
      Icon={MapPin}
      onInputChange={setSearchLocation}
      value={searchLocation}
    />
  );
}
