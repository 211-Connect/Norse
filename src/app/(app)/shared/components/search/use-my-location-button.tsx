'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAtomValue, useSetAtom } from 'jotai';
import { Locate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLocationCookies } from '../../lib/location-cookies';
import { useGeocodingAdapter } from '../../hooks/use-geocoding-adapter';
import { MapService } from '../../services/map-service';
import { searchAtom } from '../../store/search';
import { Button } from '../ui/button';
import { deviceAtom } from '../../store/device';
import { useAppConfig } from '../../hooks/use-app-config';
import { createLogger } from '@/lib/logger';

const log = createLogger('use-my-location-button');

export function UseMyLocationButton() {
  const appConfig = useAppConfig();

  const { i18n, t } = useTranslation('common');
  const adapter = useGeocodingAdapter();
  const setSearch = useSetAtom(searchAtom);
  const device = useAtomValue(deviceAtom);
  const showUseMyLocationButtonOnDesktop =
    appConfig.featureFlags.showUseMyLocationButtonOnDesktop;

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!adapter) return;

      const promise = MapService.reverseGeocode(`${lng},${lat}`, {
        locale: i18n.language,
        adapter,
      });

      toast.promise(promise, {
        loading: 'Fetching your location...',
        success: (data) => {
          const location = data?.[0];
          if (location) {
            setLocationCookies(location.address, location);

            setSearch((prev) => ({
              ...prev,
              searchLocation: location.address,
              searchCoordinates: location.coordinates,
              // Seed prevSearchLocation so useLocations fetches the address
              // and the Autocomplete block UX can activate on the result.
              prevSearchLocation: location.address,
              searchLocationValidationError: '',
              searchPlaceType: location.place_type ?? [],
              searchBbox: location.bbox ?? null,
            }));

            return 'Successfully fetched your location';
          } else {
            throw new Error();
          }
        },
        error: t('search.geocoding_unable_to_retrieve'),
      });
    },
    [adapter, i18n.language, t, setSearch],
  );

  const getUserLocation = useCallback(() => {
    const error = () => {
      toast(t('search.geocoding_error'), {
        description: t('search.geocoding_unable_to_retrieve'),
      });
    };

    if (!navigator.geolocation) {
      log.warn('Geolocation is not supported by this browser');
      toast(t('search.geocoding_error'), {
        description: t('search.geocoding_unsupported'),
      });
    } else {
      navigator.geolocation.getCurrentPosition(convertGeoLocation, error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    }
  }, [convertGeoLocation, t]);

  if (showUseMyLocationButtonOnDesktop == false && device.isDesktop)
    return false;

  return (
    <Button
      onClick={getUserLocation}
      className="flex h-auto gap-1 whitespace-normal text-left !text-primary"
      variant="ghost"
      type="button"
    >
      <Locate className="size-4" aria-hidden="true" />
      {t('search.use_my_location')}
    </Button>
  );
}
