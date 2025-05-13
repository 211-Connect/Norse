import { useCallback } from 'react';
import { toast } from 'sonner';
import { setCookie } from 'nookies';
import { useAtomValue, useSetAtom } from 'jotai';
import { Locate } from 'lucide-react';
import { deviceAtom } from '@/shared/store/device';
import { Button } from '../ui/button';
import { useGeocodingAdapter } from '../../hooks/use-geocoding-adapter';
import { MapService } from '../../services/map-service';
import { searchAtom } from '../../store/search';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '../../lib/constants';
import { useRouter } from 'next/navigation';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useLocale, useTranslations } from 'next-intl';

export function UseMyLocationButton() {
  const t = useTranslations('common');
  const appConfig = useAppConfig();
  const router = useRouter();
  const locale = useLocale();
  const adapter = useGeocodingAdapter();
  const setSearch = useSetAtom(searchAtom);
  const device = useAtomValue(deviceAtom);

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const promise = MapService.reverseGeocode(`${lng},${lat}`, {
        locale: locale,
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
              searchCoordinates: location.coordinates,
            }));
          }

          return 'Successfully fetched your location';
        },
        error: t('search.geocoding_unable_to_retrieve'),
      });
    },
    [setSearch, t, adapter, locale],
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

  if (
    appConfig.featureFlags?.showUseMyLocationButtonOnDesktop == false &&
    device.isDesktop
  )
    return false;

  return (
    <Button
      onClick={getUserLocation}
      className="flex gap-1"
      variant="ghost"
      type="button"
    >
      <Locate className="size-4" />
      {t('search.use_my_location')}
    </Button>
  );
}
