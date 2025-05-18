import { useLocationStore } from '@/lib/context/location-context/location-store-provider';
import { MapboxAdapter } from '@/shared/adapters/geocoder/mapbox-adapter';
import { getGeolocation } from '@/utils/get-geolocation';
import { Globe2Icon, LocateIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';

type useOptionsProps = {
  addresses: any[];
};

const mapbox = new MapboxAdapter();
export function useOptions({ addresses }: useOptionsProps) {
  const locale = useLocale();
  const { setSelectedValue, setSearchTerm } = useLocationStore((store) => ({
    setSelectedValue: store.setSelectedValue,
    setSearchTerm: store.setSearchTerm,
  }));
  return useMemo(() => {
    return [
      {
        value: 'Use my location',
        async onClick() {
          const { data, error } = await getGeolocation();

          if (error) {
            console.error(error);
            return;
          }

          if (data) {
            const {
              coords: { longitude, latitude },
            } = data;

            const addresses = await mapbox.reverseGeocode(
              `${longitude},${latitude}`,
              { locale },
            );

            if (addresses.length) {
              const { address, coordinates } = addresses[0];
              setSelectedValue(address);
              setSearchTerm(address);
              console.log({ address, coordinates });
            }
          }
        },
        Icon: LocateIcon,
      },
      {
        value: 'Search all locations',
        onClick() {
          console.log('Hello, world!');
        },
        Icon: Globe2Icon,
      },
      ...addresses.map((option) => ({
        value: option.address,
        group: 'Suggestions',
      })),
    ];
  }, [addresses]);
}
