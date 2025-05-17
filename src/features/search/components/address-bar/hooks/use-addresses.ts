import { MapboxAdapter } from '@/shared/adapters/geocoder/mapbox-adapter';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

const mapbox = new MapboxAdapter();
export function useAddresses(searchTerm: string | undefined) {
  const locale = useLocale();
  const query = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['taxonomies', locale, searchTerm],
    queryFn: async () => {
      if (!locale || !searchTerm?.length) return [];

      return mapbox.forwardGeocode(searchTerm, {
        locale: locale,
      });
    },
  });

  return query;
}
