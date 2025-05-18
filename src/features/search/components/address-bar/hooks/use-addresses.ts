import { useLocationStore } from '@/lib/context/location-context/location-store-provider';
import { MapboxAdapter } from '@/shared/adapters/geocoder/mapbox-adapter';
import { Address } from '@/types/address';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { useLocale } from 'next-intl';

const mapbox = new MapboxAdapter();
export function useAddresses() {
  const locale = useLocale();
  const { searchTerm } = useLocationStore((store) => ({
    searchTerm: store.searchTerm,
  }));
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const query = useQuery<Address[]>({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', locale, debouncedSearchTerm],
    queryFn: async () => {
      if (!locale || !searchTerm?.length) return [];

      return mapbox.forwardGeocode(searchTerm, {
        locale: locale,
      });
    },
  });

  return query;
}
