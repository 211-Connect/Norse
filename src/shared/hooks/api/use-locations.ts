import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { MapService } from '@/shared/services/map-service';
import { useGeocodingAdapter } from '../use-geocoding-adapter';
import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { EarthIcon } from 'lucide-react';

export function useLocations(searchTerm: string) {
  const adapter = useGeocodingAdapter();
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useQuery({
    initialData: [],
    placeholderData: (prev) => prev,
    enabled: !!adapter && searchTerm.length > 0,
    queryKey: ['locations', router.locale, searchTerm],
    queryFn: async () => {
      if (!router.locale || searchTerm.length === 0) return [];
      return await MapService.forwardGeocode(searchTerm, {
        adapter,
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
        country: t('search.everywhere', 'Everywhere'),
        district: t('search.everywhere', 'Everywhere'),
        place: t('search.everywhere', 'Everywhere'),
        postcode: t('search.everywhere', 'Everywhere'),
        region: t('search.everywhere', 'Everywhere'),
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
