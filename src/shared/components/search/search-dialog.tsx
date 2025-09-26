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

interface SearchDialogProps {
  open: boolean;
  setOpen?: (open: boolean) => void;
}

export function SearchDialog({ open, setOpen }: SearchDialogProps) {
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
          <SearchBar />
          <LocationSearchBar />
        </form>
      </DialogContent>
    </Dialog>
  );
}
