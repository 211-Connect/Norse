import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { setCookie } from 'nookies';
import { useAtomValue, useSetAtom } from 'jotai';
import { Locate } from 'lucide-react';
import { deviceAtom } from '@/shared/store/device';
import { useFlag } from '@/shared/hooks/use-flag';
import { Button } from '../ui/button';
import { useGeocodingAdapter } from '../../hooks/use-geocoding-adapter';
import { MapService } from '../../services/map-service';
import { searchAtom } from '../../store/search';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
} from '../../lib/constants';

export function UseMyLocationButton() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const adapter = useGeocodingAdapter();
  const setSearch = useSetAtom(searchAtom);
  const device = useAtomValue(deviceAtom);
  const showUseMyLocationButtonOnDesktop = useFlag(
    'showUseMyLocationButtonOnDesktop',
  );

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!adapter) return;

      const promise = MapService.reverseGeocode(`${lng},${lat}`, {
        locale: router.locale,
        adapter,
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

            setCookie(null, USER_PREF_COUNTRY, location.country, {
              path: '/',
            });

            setCookie(null, USER_PREF_DISTRICT, location.district, {
              path: '/',
            });

            setCookie(null, USER_PREF_PLACE, location.place, {
              path: '/',
            });

            setCookie(null, USER_PREF_POSTCODE, location.postcode, {
              path: '/',
            });

            setCookie(null, USER_PREF_REGION, location.region, {
              path: '/',
            });

            setSearch((prev) => ({
              ...prev,
              searchLocation: location.address,
              searchCoordinates: location.coordinates,
            }));

            return 'Successfully fetched your location';
          } else {
            throw new Error();
          }
        },
        error: t('search.geocoding_unable_to_retrieve'),
      });
    },
    [setSearch, t, adapter, router.locale],
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
      className="flex gap-1 !text-primary"
      variant="ghost"
      type="button"
    >
      <Locate className="size-4" />
      {t('search.use_my_location')}
    </Button>
  );
}
