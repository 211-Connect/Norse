import Autocomplete, { Option } from '@/components/ui/autocomplete';
import useDebounce from '@/lib/hooks/use-debounce';
import { IconLocation, IconMapPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useRef, useState } from 'react';
import LocationAdapter from '../adapters/location-adapter';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { setCookie } from 'nookies';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/lib/constants/cookies';
import { Button } from '@/components/ui/button';

export default function LocationInput({
  name,
  onChange,
  onCoordChange,
}: {
  name?: string;
  onChange?: (option: Option) => void;
  onCoordChange?: (coords: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [coords, setCoords] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const debouncedValue = useDebounce(value);
  const { data } = useQuery<Option>({
    placeholderData: (prev) => prev,
    queryKey: ['suggestions', debouncedValue],
    queryFn: async () => {
      if (!debouncedValue || debouncedValue.length < 2) return null;

      const locationAdapter = LocationAdapter();
      const data = await locationAdapter.searchLocations(debouncedValue);

      return {
        group: t('search.suggestions'),
        items:
          data?.features?.map((feature) => ({
            value: feature.place_name,
            coordinates: feature.center,
          })) ?? [],
      };
    },
  });

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        // fetch location
        const res = await fetch(`/api/geocode?coords=${lng},${lat}`);
        const data = await res.json();

        setValue(data.address);
        setCookie(null, USER_PREF_LOCATION, data.address, { path: '/' });
        setCookie(null, USER_PREF_COORDS, `${lng},${lat}`, { path: '/' });
        setCoords(`${lng},${lat}`);
        onCoordChange?.(`${lng},${lat}`);
      } catch (err) {
        toast.error(t('search.geocoding_error'), {
          description: t('search.geocoding_unable_to_retrieve'),
        });
      } finally {
        setIsFetching(false);
      }
    },
    [t, onCoordChange]
  );

  const getUserLocation = useCallback(() => {
    setIsFetching(true);

    const error = () => {
      toast.error(t('search.geocoding_error'), {
        description: t('search.geocoding_unable_to_retrieve'),
      });
      setIsFetching(false);
    };

    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
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

  const onValueChange = (option: Option) => {
    onChange?.(option);
    setValue(option.value);
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    return {
      group: data?.group,
      items: data?.items?.filter((i) => {
        return i?.value?.toLowerCase()?.includes(value.toLowerCase());
      }),
    };
  }, [data, value]);

  return (
    <>
      <div className="flex flex-col justify-center items-start">
        <Autocomplete
          name={name}
          className="w-full"
          options={filteredData ? [filteredData] : []}
          value={value}
          placeholder={
            t('search.location_placeholder', {
              ns: 'dynamic',
              defaultValue: t('search.location_placeholder'),
            }) || ''
          }
          Icon={IconMapPin}
          onValueChange={onValueChange}
          defaultValue={router.query?.location as string}
        />
        <Button
          type="button"
          disabled={isFetching}
          className="gap-1"
          onClick={getUserLocation}
        >
          <IconLocation className="size-4" />
          {t('search.use_my_location')}
        </Button>
      </div>
    </>
  );
}
