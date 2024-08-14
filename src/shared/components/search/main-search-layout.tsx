import { DistanceSelect } from './distance-select';
import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { UseMyLocationButton } from './use-my-location-button';

export function MainSearchLayout() {
  return (
    <div className="flex flex-col gap-1">
      <SearchBar />

      <div className="flex items-stretch justify-stretch gap-1">
        <LocationSearchBar className="flex-1" />
        <DistanceSelect />
      </div>

      <div className="flex justify-between">
        <UseMyLocationButton />
        <SearchButton />
      </div>
    </div>
  );
}
