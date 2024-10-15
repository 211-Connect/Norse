import { useAtomValue, useSetAtom } from 'jotai';
import { DistanceSelect } from './distance-select';
import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { UseMyLocationButton } from './use-my-location-button';
import { useFlag } from '@/shared/hooks/use-flag';
import { deviceAtom } from '@/shared/store/device';
import { cn } from '@/shared/lib/utils';
import { SearchService } from '@/shared/services/search-service';
import { useMemo } from 'react';
import { useCategories } from '@/shared/hooks/use-categories';
import { useSuggestions } from '@/shared/hooks/use-suggestions';
import { useTaxonomies } from '@/shared/hooks/api/use-taxonomies';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { searchAtom } from '@/shared/store/search';
import { useRouter } from 'next/router';

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

  const reducedCategories: {
    name: string;
    query: string;
    queryType: string;
  }[] = useMemo(() => {
    return categories.reduce((prev, current) => {
      if (current?.subcategories?.length > 0) {
        return prev.concat(current.subcategories);
      }

      return prev;
    }, []);
  }, [categories]);

  // Find the taxonomy code to be used for a query
  // Fallback to the original string value if a code isn't found
  const findCode = (value: string) => {
    const taxonomy = taxonomies.find(
      (tax) => tax.name.toLowerCase() === value.toLowerCase(),
    );
    if (taxonomy) return taxonomy.code;

    const suggestion = suggestions.find(
      (sugg) => sugg.name.toLowerCase() === value.toLowerCase(),
    );
    if (suggestion) return suggestion.taxonomies;

    const category = reducedCategories.find(
      (cat) => cat.name.toLowerCase() === value.toLowerCase(),
    );
    if (category) return category.query;

    return value;
  };

  const getQueryType = (value, query) => {
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

    const urlParams = SearchService.createUrlParamsForSearch({
      ...search,
      query,
      queryType,
    });

    await router.push({
      pathname: '/search',
      query: urlParams,
    });

    setSearch((prev) => ({
      ...prev,
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
