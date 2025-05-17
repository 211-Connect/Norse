import { getGeolocation } from '@/utils/get-geolocation';
import { Globe2Icon, LocateIcon } from 'lucide-react';
import { useMemo } from 'react';

type useOptionsProps = {
  addresses: any[];
};

export function useOptions({ addresses }: useOptionsProps) {
  return useMemo(() => {
    return [
      {
        value: 'Use my location',
        async onClick() {
          const { data } = await getGeolocation();
          console.log(data);
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
