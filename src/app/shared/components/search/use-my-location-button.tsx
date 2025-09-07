import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAtomValue, useSetAtom } from 'jotai';
import { Locate } from 'lucide-react';
import { deviceAtom } from '@/app/shared/store/device';
import { useFlag } from '@/app/shared/hooks/use-flag';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

import { useGeocodingAdapter } from '../../hooks/use-geocoding-adapter';
import { MapService } from '../../services/map-service';
import { searchAtom } from '../../store/search';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '../../lib/constants';
import { setCookie } from 'cookies-next/client';

export function UseMyLocationButton() {
  const adapter = useGeocodingAdapter();
  const setSearch = useSetAtom(searchAtom);
  const device = useAtomValue(deviceAtom);
  const showUseMyLocationButtonOnDesktop = useFlag(
    'showUseMyLocationButtonOnDesktop',
  );
  const { t, i18n } = useTranslation('common');

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!adapter.current) return;

      const promise = MapService.reverseGeocode(`${lng},${lat}`, {
        locale: i18n.language,
        adapter: adapter.current,
      });

      toast.promise(promise, {
        loading: 'Fetching your location...',
        success: (data) => {
          const location = data?.[0];
          if (location) {
            setCookie(USER_PREF_LOCATION, location.address, {
              path: '/',
            });

            setCookie(USER_PREF_COORDS, location.coordinates.join(','), {
              path: '/',
            });

            setSearch((prev) => ({
              ...prev,
              searchLocation: location.address,
              searchCoordinates: location.coordinates,
            }));
          }

          return 'Successfully fetched your location';
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
      console.log('Geolocation is not supported by your browser');
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
      className="flex gap-1"
      variant="outline"
      type="button"
    >
      <Locate className="size-4" />
      {t('search.use_my_location')}
    </Button>
  );
}
