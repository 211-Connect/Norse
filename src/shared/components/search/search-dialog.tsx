import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from '../ui/dialog';
import { SearchBar } from './search-bar';
import { LocationSearchBar } from './location-search-bar';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { ChevronLeft } from 'lucide-react';
import { SearchButton } from './search-button';
import { useFlag } from '@/shared/hooks/use-flag';
import { SearchService } from '@/shared/services/search-service';
import { useRouter } from 'next/router';
import { useSearchResources } from '@/shared/hooks/use-search-resources';
import { DialogTitle } from '@radix-ui/react-dialog';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  open: boolean;
  setOpen?: (open: boolean) => void;
}

export function SearchDialog({
  focusByDefault = 'search',
  open,
  setOpen,
}: SearchDialogProps) {
  const { t } = useTranslation('common');

  const requireUserLocation = useFlag('requireUserLocation');

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { findCode, getQueryType, locations, search, setSearch } =
    useSearchResources();

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (requireUserLocation && search.searchLocation.trim().length === 0) {
        setSearch((prev) => ({
          ...prev,
          searchLocationValidationError: 'Address is required.',
        }));
        return;
      }

      setLoading(true);

      // If the search term matches the query label and we have an existing query,
      // preserve the original query and query_type
      let query = search.query;
      let queryType = search.queryType;

      // Only recalculate if the user has actually changed the search term
      if (search.searchTerm !== search.queryLabel || !search.query) {
        query = findCode(search.searchTerm);
        queryType = getQueryType(search.searchTerm, query);
      }

      // Ensure queryType is never empty - default to 'taxonomy' if we have a query
      if (!queryType && query) {
        queryType = 'taxonomy';
      }

      const location = locations[0];
      // Only update location params if the user has actually changed the location
      // Compare with prevSearchLocation to detect user changes
      const hasLocationChanged =
        search.searchLocation !== search.prevSearchLocation;
      const locationParams =
        hasLocationChanged && location?.address && location?.coordinates
          ? {
              searchLocation: location.address,
              searchCoordinates: location.coordinates,
            }
          : {};

      const urlParams = SearchService.createUrlParamsForSearch({
        ...search,
        ...locationParams,
        query,
        queryType,
      });

      await router.push({
        pathname: '/search',
        query: urlParams,
      });

      setLoading(false);

      setSearch((prev) => ({
        ...prev,
        ...locationParams,
        userCoordinates: search.searchCoordinates,
      }));
    },
    [
      findCode,
      getQueryType,
      locations,
      requireUserLocation,
      router,
      search,
      setSearch,
    ],
  );

  useEffect(() => {
    setOpen?.(false);
  }, [router.asPath, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription />
      <DialogContent
        className="flex h-full w-full max-w-full justify-center !rounded-none border-0"
        withClose={false}
      >
        <form
          onSubmit={onSubmit}
          className="mt-[120px] flex w-full max-w-[400px] flex-col gap-4"
        >
          <DialogHeader className="flex flex-row justify-between gap-4">
            <Button
              type="button"
              className="self-start"
              variant="highlight"
              onClick={() => setOpen?.(false)}
            >
              <ChevronLeft className="size-4 text-primary" />
              {t('search.back')}
            </Button>
            <SearchButton loading={loading} />
          </DialogHeader>
          <SearchBar focusByDefault={focusByDefault === 'search'} />
          <LocationSearchBar focusByDefault={focusByDefault === 'location'} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
