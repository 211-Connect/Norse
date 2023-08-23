import {
  Group,
  useMantineTheme,
  Autocomplete,
  Loader,
  AutocompleteProps,
  Button,
  Indicator,
  Flex,
  Select,
} from '@mantine/core';
import { useDebouncedValue, useInputState, useToggle } from '@mantine/hooks';
import { IconLocationFilled, IconMapPin } from '@tabler/icons-react';
import { RefAttributes, useCallback, useEffect, useRef, useState } from 'react';
import { showNotification } from '@mantine/notifications';
import { useRouter } from 'next/router';
import { setCookie } from 'nookies';
import {
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from '../../lib/constants/cookies';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../../lib/hooks/useAppConfig';

type Props = Partial<AutocompleteProps> &
  RefAttributes<HTMLInputElement> & { defaultCoords?: string };

export function LocationAutocomplete(props: Props) {
  const theme = useMantineTheme();
  const appConfig = useAppConfig();
  const [isLoading, toggle] = useToggle([false, true]);
  const [value, setValue] = useInputState(props?.defaultValue ?? '');
  const [debounced] = useDebouncedValue(value, 200);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useTranslation('common');

  const handleItemSubmit = (e: any) => {
    if (hiddenInputRef.current) {
      setCookie(null, USER_PREF_COORDS, e.coordinates);
      hiddenInputRef.current.value = e.coordinates;
    }
  };

  const handleChange = (value: string) => {
    setValue(value);
    setCookie(null, USER_PREF_LOCATION, value);

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const convertGeoLocation = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        // fetch location
        const res = await fetch(`/api/geocode?coords=${lng},${lat}`);
        const data = await res.json();

        setValue(data.address);
        setCookie(null, USER_PREF_LOCATION, data.address);
        if (hiddenInputRef.current) {
          setCookie(null, USER_PREF_COORDS, `${lng},${lat}`);
          hiddenInputRef.current.value = `${lng},${lat}`;
        }
      } catch (err) {
        showNotification({
          title: t('search.geocoding_error'),
          message: t('search.geocoding_unable_to_retrieve'),
          color: 'red',
          autoClose: 5000,
        });
      }

      toggle(false);
    },
    [setValue, toggle, t]
  );

  const getUserLocation = useCallback(() => {
    const error = () => {
      toggle(false);
      showNotification({
        title: t('search.geocoding_error'),
        message: t('search.geocoding_unable_to_retrieve'),
        color: 'red',
        autoClose: 5000,
      });
    };

    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
      showNotification({
        title: t('search.geocoding_error'),
        message: t('search.geocoding_unsupported'),
        color: 'red',
        autoClose: 5000,
      });
    } else {
      toggle(true);

      navigator.geolocation.getCurrentPosition(convertGeoLocation, error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    }
  }, [toggle, convertGeoLocation, t]);

  useEffect(() => {
    if (debounced.length < 2) return;

    (async function () {
      const res = await fetch(
        `/api/geocode?address=${debounced}&autocomplete=true`
      );
      const data = await res.json();

      setSuggestions(
        data.features?.map((el: any) => ({
          value: el.place_name,
          group: t('search.suggestions'),
          group_label: 'Suggestions',
          coordinates: el.center,
        })) ?? []
      );
    })();
  }, [debounced, t]);

  useEffect(() => {
    function routeChangeCompleteHandler(e: any) {
      const query = e.split('?')[1];
      const searchParams = new URLSearchParams(query);
      const location = searchParams.get('location');
      const coords = searchParams.get('coords');

      if (location !== value) {
        setValue(location || '');

        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = coords || '';
        }
      }
    }

    router.events.on('routeChangeComplete', routeChangeCompleteHandler);

    return () => {
      router.events.off('routeChangeComplete', routeChangeCompleteHandler);
    };
  }, [router.events, value, setValue]);

  return (
    <>
      <Flex align="center" mt="sm">
        <Autocomplete
          aria-label={
            t('search.location_placeholder', {
              ns: 'dynamic',
              defaultValue: t('search.location_placeholder'),
            }) || ''
          }
          placeholder={
            t('search.location_placeholder', {
              ns: 'dynamic',
              defaultValue: t('search.location_placeholder'),
            }) || ''
          }
          size="md"
          value={value}
          name="location"
          onChange={handleChange}
          onItemSubmit={handleItemSubmit}
          icon={<IconMapPin />}
          data={suggestions}
          w="100%"
          rightSection={isLoading && <Loader size="sm" />}
          sx={{ flex: 1 }}
          styles={{
            input: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
        />

        <Select
          disabled={!value}
          name="radius"
          aria-label={t('search.radius_placeholder') as string}
          data={[
            { value: '0', label: t('search.any') },
            ...(appConfig?.search?.radiusOptions?.map((el: any) => ({
              value: el.value.toString(),
              label: `${el.value} ${t('search.miles')}`,
            })) ?? [
              { value: '15', label: `15 ${t('search.miles')}` },
              { value: '30', label: `30 ${t('search.miles')}` },
              { value: '45', label: `45 ${t('search.miles')}` },
            ]),
          ]}
          defaultValue={appConfig?.search?.defaultRadius?.toString() ?? '0'}
          size="md"
          placeholder={
            (t('search.radius_placeholder') as string) ||
            (t('search.radius_placeholder', { ns: 'dynamic' }) as string) ||
            ''
          }
          maw={125}
          styles={{
            input: {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            },
          }}
        />
      </Flex>

      <input
        hidden
        name="coords"
        ref={hiddenInputRef}
        defaultValue={props?.defaultCoords ?? ''}
      />

      <Group position="left">
        <Indicator position="top-start" size={10} color="red">
          <Button
            mt="sm"
            leftIcon={<IconLocationFilled size={theme.fontSizes.xs} />}
            size="xs"
            onClick={getUserLocation}
            variant="light"
          >
            {t('search.use_my_location')}
          </Button>
        </Indicator>
      </Group>
    </>
  );
}
