'use client';

import { useQuery } from '@tanstack/react-query';
import { MapService } from '@/app/(app)/shared/services/map-service';
import { useGeocodingAdapter } from '../use-geocoding-adapter';
import { useMemo } from 'react';
import { EarthIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function useLocations(searchTerm: string) {
  const adapter = useGeocodingAdapter();
  const { t, i18n } = useTranslation();

  const { data } = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    queryKey: ['locations', i18n.language, searchTerm],
    queryFn: async () => {
      if (!i18n.language || searchTerm.length === 0 || !adapter.current)
        return [];
      return await MapService.forwardGeocode(searchTerm, {
        adapter: adapter.current,
        locale: i18n.language,
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
        Icon: EarthIcon,
      })),
      ...data.map((loc) => ({
        value: loc.address,
        Icon: EarthIcon,
      })),
    ];
  }, [data, additionalLocations]);

  return { data, options, additionalLocations };
}
