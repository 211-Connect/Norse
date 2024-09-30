import { useAtomValue } from 'jotai';
import { DistanceSelect } from './distance-select';
import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { UseMyLocationButton } from './use-my-location-button';
import { useFlag } from '@/shared/hooks/use-flag';
import { deviceAtom } from '@/shared/store/device';
import { cn } from '@/shared/lib/utils';

export function MainSearchLayout() {
  const device = useAtomValue(deviceAtom);
  const showUseMyLocationButtonOnDesktop = useFlag(
    'showUseMyLocationButtonOnDesktop',
  );

  return (
    <div className="flex flex-col gap-1">
      <SearchBar />

      <div className="flex items-stretch justify-stretch gap-1">
        <LocationSearchBar className="flex-1" />
        <DistanceSelect />
      </div>

      <div
        className={cn(
          'flex',
          showUseMyLocationButtonOnDesktop == false && device.isDesktop
            ? 'justify-end'
            : 'justify-between',
        )}
      >
        <UseMyLocationButton />
        <SearchButton />
      </div>
    </div>
  );
}
