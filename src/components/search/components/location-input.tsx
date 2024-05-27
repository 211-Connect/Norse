import Autocomplete, { Option } from '@/components/ui/autocomplete';
import useDebounce from '@/hooks/use-debounce';
import { IconLocation, IconMapPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useCallback, useMemo, useState } from 'react';
import LocationAdapter from '../adapters/location-adapter';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { SESSION_ID } from '@/lib/constants/cookies';
import { Button } from '@/components/ui/button';
import { useCookies } from 'react-cookie';

export default function LocationInput({
  name,
  className,
  onChange,
  onCoordChange,
}: {
  name?: string;
  className?: string;
  onChange?: (option: Option) => void;
  onCoordChange?: (coords: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [cookies] = useCookies([SESSION_ID]);
  const [isFetching, setIsFetching] = useState(false);
  const debouncedValue = useDebounce(value);
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

      const locationAdapter = LocationAdapter();
      const data = await locationAdapter.search(
        debouncedValue,
        router.locale,
        cookies[SESSION_ID]
      );

      return {
        group: t('search.suggestions'),
        items:
          data?.suggestions?.map((suggestion) => ({
            value: suggestion.full_address,
            mapbox_id: suggestion.mapbox_id,
          })) ?? [],
      };
    },
  });

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const coords = [position.coords.longitude, position.coords.latitude].join(
        ','
      );

      try {
        const locationAdapter = LocationAdapter();
        const data = await locationAdapter.reverseGeocode(
          coords,
          router.locale
        );
        setValue(data?.features?.[0]?.place_name);
        onCoordChange?.(coords);
      } catch (err) {
        toast.error(t('search.geocoding_error'), {
          description: t('search.geocoding_unable_to_retrieve'),
        });
      } finally {
        setIsFetching(false);
      }
    },
    [t, onCoordChange, router.locale]
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

  const onValueSelect = async (option: Option & { mapbox_id: string }) => {
    const locationAdapter = LocationAdapter();
    const data = await locationAdapter.retrieve(
      option.mapbox_id,
      router.locale,
      cookies[SESSION_ID]
    );
    const coords = data?.features?.[0]?.geometry?.coordinates;
    onCoordChange?.(coords.join(','));
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
    <div className={className}>
      <div className="flex flex-col justify-center items-start">
        <Autocomplete
          name={name}
          className="w-full"
          options={filteredData ? [filteredData] : []}
          placeholder={
            t('search.location_placeholder', {
              ns: 'dynamic',
              defaultValue: t('search.location_placeholder'),
            }) || ''
          }
          Icon={IconMapPin}
          onValueChange={onValueChange}
          defaultValue={(router.query?.location as string) ?? ''}
          onValueSelect={onValueSelect}
        />
        <Button
          type="button"
          disabled={isFetching}
          className="gap-1"
          onClick={getUserLocation}
          variant="outline"
        >
          <IconLocation className="size-4" />
          {t('search.use_my_location')}
        </Button>
      </div>
    </div>
  );
}
