import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { MapService } from '@/shared/services/map-service';
import { useMapAdapter } from '../use-map-adapter';

export function useLocations(searchTerm: string) {
  const adapter = useMapAdapter();
  const router = useRouter();
  const { data } = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['locations', router.locale, searchTerm],
    queryFn: async () => {
      if (!router.locale || searchTerm.length === 0) return [];
      return await MapService.forwardGeocode(searchTerm, {
        adapter: adapter.current,
        locale: router.locale,
      });
    },
  });

  return { data };
}
