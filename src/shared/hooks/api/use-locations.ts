'use client';
import { useQuery } from '@tanstack/react-query';
import { MapService } from '@/shared/services/map-service';
import { useGeocodingAdapter } from '../use-geocoding-adapter';
import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { NavigationIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function useLocations(searchTerm: string) {
  const adapter = useGeocodingAdapter();
  const { t } = useTranslation();
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
        Icon: NavigationIcon,
      })),
      ...data.map((loc) => ({
        value: loc.address,
        Icon: NavigationIcon,
      })),
    ];
  }, [data, additionalLocations]);

  return { data, options, additionalLocations };
}
