'use client';

import { useQuery } from '@tanstack/react-query';
import { MapService } from '@/app/(app)/shared/services/map-service';
import { useGeocodingAdapter } from '../use-geocoding-adapter';
import { useMemo } from 'react';
import { EarthIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GeocodeResult } from '@/types/resource';

export function useLocations(searchTerm: string, excludeEverywhere = false) {
  const adapter = useGeocodingAdapter();
  const { t, i18n } = useTranslation();

  const { data = [] } = useQuery({
    placeholderData: (prev) => prev,
    queryKey: ['locations', i18n.language, searchTerm],
    enabled: !!adapter && searchTerm.length > 0,
    queryFn: async () => {
      if (!i18n.language || searchTerm.length === 0 || !adapter) return [];
      return await MapService.forwardGeocode(searchTerm, {
        adapter,
        locale: i18n.language,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const additionalLocations = useMemo<GeocodeResult[]>(
    () => [
      {
        type: 'invalid', // Mark as invalid to trigger cookie deletion and empty search
        address: t('search.everywhere', 'Everywhere'),
        coordinates: [0, 0], // Dummy coordinates to satisfy strict type
        country: t('search.everywhere', 'Everywhere'),
        district: t('search.everywhere', 'Everywhere'),
        place: t('search.everywhere', 'Everywhere'),
        postcode: t('search.everywhere', 'Everywhere'),
        region: t('search.everywhere', 'Everywhere'),
        place_type: [],
        bbox: undefined,
      },
    ],
    [t],
  );

  const options = useMemo(() => {
    return [
      ...(excludeEverywhere
        ? []
        : additionalLocations.map((loc) => ({
            value: loc.address,
            Icon: EarthIcon,
          }))),
      ...data.map((loc) => ({
        value: loc.address,
        Icon: EarthIcon,
      })),
    ];
  }, [data, additionalLocations, excludeEverywhere]);

  return { data, options, additionalLocations };
}
