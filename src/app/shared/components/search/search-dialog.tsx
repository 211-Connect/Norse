'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { DialogTitle } from '@radix-ui/react-dialog';

import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from '../ui/dialog';
import { useTranslation } from 'react-i18next';
import { useFlag } from '../../hooks/use-flag';
import { useSearchResources } from '../../hooks/use-search-resources';
import { createUrlParamsForSearch } from '../../services/search-service';
import { usePathname, useRouter } from 'next/navigation';
import { useClientSearchParams } from '../../hooks/use-client-search-params';
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

  const { stringifySearchParams } = useClientSearchParams();

  const router = useRouter();
  const pathname = usePathname();
  const { stringifiedSearchParams } = useClientSearchParams();

  const requireUserLocation = useFlag('requireUserLocation');

  const [loading, setLoading] = useState(false);

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

      const urlParams = createUrlParamsForSearch({
        ...search,
        ...locationParams,
        query,
        queryType,
      });

      const queryParams = stringifySearchParams(new URLSearchParams(urlParams));

      router.push(`/search?${queryParams}`);

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
      stringifySearchParams,
    ],
  );

  useEffect(() => {
    setOpen?.(false);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [pathname, stringifiedSearchParams, setOpen]);

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
