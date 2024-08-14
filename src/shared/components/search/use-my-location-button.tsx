import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { setCookie } from 'nookies';
import { useSetAtom } from 'jotai';
import { Locate } from 'lucide-react';
import { Button } from '../ui/button';
import { useMapAdapter } from '../../hooks/use-map-adapter';
import { MapService } from '../../services/map-service';
import { searchAtom } from '../../store/search';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '../../lib/constants';

export function UseMyLocationButton() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const adapter = useMapAdapter();
  const setSearch = useSetAtom(searchAtom);

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const promise = MapService.reverseGeocode(`${lng},${lat}`, {
        locale: router.locale,
        adapter: adapter.current,
      });

      toast.promise(promise, {
        loading: 'Fetching your location...',
        success: (data) => {
          const location = data?.[0];
          if (location) {
            setCookie(null, USER_PREF_LOCATION, location.address, {
              path: '/',
            });

            setCookie(null, USER_PREF_COORDS, location.coordinates.join(','), {
              path: '/',
            });

            setSearch((prev) => ({
              ...prev,
              searchLocation: location.address,
              userLocation: location.address,
              userCoordinates: location.coordinates,
            }));
          }

          return 'Successfully fetched your location';
        },
        error: t('search.geocoding_unable_to_retrieve'),
      });
    },
    [setSearch, t],
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

  return (
    <Button onClick={getUserLocation} className="flex gap-1">
      <Locate className="size-4" />
      {t('search.use_my_location')}
    </Button>
  );
}
