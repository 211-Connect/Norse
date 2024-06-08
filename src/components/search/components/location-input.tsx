import Autocomplete, { Option } from '@/components/ui/autocomplete';
import useDebounce from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';
import _router, { useRouter } from 'next/router';
import { toast } from 'sonner';
import {
  SESSION_ID,
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '@/constants/cookies';
import { Button } from '@/components/ui/button';
import { useCookies } from 'react-cookie';
import { atom, useAtom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { setCookie, parseCookies } from 'nookies';
import { Locate, MapPin } from 'lucide-react';
import useMapAdapter from '@/lib/adapters/map/use-map-adapter';
import { type LngLatLike } from 'maplibre-gl';

export const locationAtom = atom({
  value: '',
  coords: '',
});

locationAtom.onMount = (set) => {
  const cookies = parseCookies(null);
  const locationCookie = cookies[USER_PREF_LOCATION];
  const coordsCookie = cookies[USER_PREF_COORDS];

  set({
    value: (_router.query?.location as string) ?? locationCookie ?? '',
    coords: (_router.query?.coords as string) ?? coordsCookie ?? '',
  });
};

const locationAtomEffect = atomEffect((get) => {
  const location = get(locationAtom);
  setCookie(null, USER_PREF_LOCATION, location.value, { path: '/' });
  setCookie(null, USER_PREF_COORDS, location.coords, { path: '/' });
});

export default function LocationInput({
  name,
  className,
  onInputChange,
  onValueSelect,
  onCoordChange,
}: {
  name?: string;
  className?: string;
  onInputChange?: (value: string) => void;
  onValueSelect?: (option: Option) => void;
  onCoordChange?: (coords: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [location, setLocation] = useAtom(locationAtom);
  const locationAdapter = useMapAdapter();
  useAtom(locationAtomEffect);
  const [cookies] = useCookies([SESSION_ID]);
  const [isFetching, setIsFetching] = useState(false);
  const debouncedValue = useDebounce(location.value);
  const { data } = useQuery<Option>({
    placeholderData: (prev) => prev,
    queryKey: [
      'suggestions',
      debouncedValue,
      router.locale,
      cookies[SESSION_ID],
    ],
    queryFn: async () => {
      if (!debouncedValue || debouncedValue.length < 2) return null;

      const data = await locationAdapter.current.search(debouncedValue);

      return {
        group: t('search.suggestions'),
        items:
          data?.map((suggestion) => ({
            value: suggestion.address,
            coordinates: suggestion.coordinates,
          })) ?? [],
      };
    },
  });

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const coords = [position.coords.longitude, position.coords.latitude].join(
        ',',
      );

      try {
        const data = await locationAdapter.current.reverseGeocode(coords);
        setLocation((prev) => ({
          ...prev,
          coords: coords,
          value: data?.address,
        }));

        onInputChange?.(data?.address);
        onCoordChange?.(coords);
      } catch (err) {
        toast.error(t('search.geocoding_error'), {
          description: t('search.geocoding_unable_to_retrieve'),
        });
      } finally {
        setIsFetching(false);
      }
    },
    [t, onCoordChange, locationAdapter, setLocation, onInputChange],
  );

  const getUserLocation = useCallback(() => {
    setIsFetching(true);

    const error = (err) => {
      console.error(err);
      toast.error(t('search.geocoding_error'), {
        description: t('search.geocoding_unable_to_retrieve'),
      });
      setIsFetching(false);
    };

    if (!navigator.geolocation) {
      toast.error(t('search.geocoding_error'), {
        description: t('search.geocoding_unsupported'),
      });
      setIsFetching(false);
    } else {
      navigator.geolocation.getCurrentPosition(convertGeoLocation, error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    }
  }, [convertGeoLocation, t]);

  const onChange = (value: string) => {
    setLocation((prev) => ({ ...prev, coords: '', value: value }));
    onInputChange?.(value);
  };

  const onSelect = async (option: Option & { coordinates: LngLatLike }) => {
    const coords = option.coordinates;
    setLocation((prev) => ({
      ...prev,
      coords: coords.toString(),
    }));
    onValueSelect?.(option);
    onCoordChange?.(coords.toString());
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    return {
      group: data?.group,
      items: data?.items?.filter((i) => {
        return i?.value?.toLowerCase()?.includes(location.value?.toLowerCase());
      }),
    };
  }, [data, location.value]);

  return (
    <div className={className}>
      <div className="flex flex-col items-start justify-center">
        <Autocomplete
          name={name}
          className="w-full"
          options={filteredData ? [filteredData] : []}
          placeholder={t('search.location_placeholder') || ''}
          value={location.value}
          Icon={MapPin}
          onInputChange={onChange}
          onValueSelect={onSelect}
        />
        <Button
          type="button"
          disabled={isFetching}
          className="gap-1"
          onClick={getUserLocation}
          variant="outline"
        >
          <Locate className="size-4" />
          {t('search.use_my_location')}
        </Button>
      </div>
    </div>
  );
}
