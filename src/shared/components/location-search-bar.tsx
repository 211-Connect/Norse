import { useTranslation } from 'next-i18next';
import { MapPin } from 'lucide-react';
import { Autocomplete } from './autocomplete';
import { useAtomValue, useSetAtom } from 'jotai';
import { searchAtom, searchLocationAtom } from '../store/search';
import { useDebounce } from '../hooks/use-debounce';
import { useLocations } from '../hooks/api/use-locations';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

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
    setSearch((prev) => ({
      ...prev,
      searchLocation: value,
      userLocation: value,
      userCoordinates: findCoords(value),
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
