'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFlag } from '@/app/shared/hooks/use-flag';
import { cn } from '@/app/shared/lib/utils';
import { createUrlParamsForSearch } from '@/app/shared/services/search-service';
import { deviceAtom } from '@/app/shared/store/device';
import { Subcategory, useCategories } from '@/app/shared/hooks/use-categories';
import { useSuggestions } from '@/app/shared/hooks/use-suggestions';
import { useTaxonomies } from '@/app/shared/hooks/api/use-taxonomies';
import { useDebounce } from '@/app/shared/hooks/use-debounce';
import { searchAtom, searchLocationAtom } from '@/app/shared/store/search';
import { useLocations } from '@/app/shared/hooks/api/use-locations';

import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { UseMyLocationButton } from './use-my-location-button';

export function MainSearchLayout() {
  const device = useAtomValue(deviceAtom);
  const showUseMyLocationButtonOnDesktop = useFlag(
    'showUseMyLocationButtonOnDesktop',
  );

  const router = useRouter();
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);
  const debouncedSearchTerm = useDebounce(search.searchTerm, 200);
  const { data: taxonomies } = useTaxonomies(debouncedSearchTerm);
  const suggestions = useSuggestions();
  const categories = useCategories();
  const requireUserLocation = useFlag('requireUserLocation');
  const searchLocation = useAtomValue(searchLocationAtom);
  const debouncedSearchLocation = useDebounce(searchLocation, 200);
  const { data: locations } = useLocations(debouncedSearchLocation);

  const reducedCategories: {
    name: string;
    query: string;
    queryType: string;
  }[] = useMemo(() => {
    return categories.reduce<Subcategory[]>((prev, current) => {
      if (current?.subcategories && current.subcategories.length > 0) {
        return prev.concat(current.subcategories);
      }

      return prev;
    }, []);
  }, [categories]);

  // Find the taxonomy code to be used for a query
  // Fallback to the original string value if a code isn't found
  const findCode = (value: string) => {
    const taxonomy = taxonomies.find(
      (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (taxonomy) return taxonomy.code;

    const suggestion = suggestions.find(
      (sugg) => sugg?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (suggestion) return suggestion.taxonomies;

    const category = reducedCategories.find(
      (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (category) return category.query;

    return value;
  };

  const getQueryType = (value, query) => {
    const taxonomy = taxonomies.find(
      (tax) => tax?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (taxonomy) return 'taxonomy';

    const suggestion = suggestions.find(
      (sugg) => sugg?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (suggestion) return 'taxonomy';

    const category = reducedCategories.find(
      (cat) => cat?.name?.toLowerCase() === value.toLowerCase(),
    );
    if (category) return 'taxonomy';

    if (query.trim().length === 0) return '';
    if (query === value) return 'text';
    return 'taxonomy';
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (requireUserLocation && search.searchLocation.trim().length === 0) {
      setSearch((prev) => ({
        ...prev,
        searchLocationValidationError: 'Address is required.',
      }));
      return;
    }

    const query = findCode(search.searchTerm);
    const queryType = getQueryType(search.searchTerm, query);

    const location = locations[0];
    const locationParams =
      location?.address && location?.coordinates
        ? {
            searchLocation: location.address,
            searchCoordinates: location.coordinates,
          }
        : {};

    const urlParams = createUrlParamsForSearch({
      ...search,
      ...locationParams,
      query,
      queryType,
    });

    const urlSearchParams = new URLSearchParams(
      Object.entries(urlParams)
        .filter(([_, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    );

    router.push(`search?${urlSearchParams}`);

    setSearch((prev) => ({
      ...prev,
      ...locationParams,
      userCoordinates: search.searchCoordinates,
    }));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <SearchBar />

      <LocationSearchBar />

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
    </form>
  );
}
