'use client';

import { useCallback, useEffect, useTransition } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useFlag } from '../../hooks/use-flag';
import { useAppConfig } from '../../hooks/use-app-config';
import { createUrlParamsForSearch } from '../../services/search-service';
import { useClientSearchParams } from '../../hooks/use-client-search-params';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  open: boolean;
  setOpen?: (open: boolean) => void;
}

export const SEARCH_DIALOG_ID = 'search-dialog';

const SEARCH_INPUT_ID = 'search-input';
const LOCATION_INPUT_ID = 'location-input';

export function SearchDialog({
  focusByDefault = 'search',
  open,
  setOpen,
}: SearchDialogProps) {
  const { t } = useTranslation('common');
  const [isPending, startTransition] = useTransition();
  const { stringifySearchParams } = useClientSearchParams();
  const router = useRouter();
  const appConfig = useAppConfig();
  const requireUserLocation = useFlag('requireUserLocation');

  const { findCode, locations, search, setSearch } =
    useMainSearchLayoutContext();

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      startTransition(() => {
        if (requireUserLocation && search.searchLocation.trim().length === 0) {
          setSearch((prev) => ({
            ...prev,
            searchLocationValidationError: 'Address is required.',
          }));
          return;
        }

        const query = findCode(search.searchTerm);

        const location = locations[0];
        const hasLocationChanged =
          search.searchLocation !== search.prevSearchLocation;
        const locationParams =
          hasLocationChanged && location?.address && location?.coordinates
            ? {
                searchLocation: location.address,
                searchCoordinates: location.coordinates,
              }
            : {};

        const urlParams = createUrlParamsForSearch(
          {
            ...search,
            ...locationParams,
            query: query || '',
            queryType:
              search.queryType ||
              (appConfig.search.hybridSemanticSearchEnabled
                ? 'hybrid'
                : 'text'),
          },
          appConfig.search.hybridSemanticSearchEnabled,
        );

        const queryParams = stringifySearchParams(
          new URLSearchParams(urlParams),
        );

        router.push(`/search${queryParams}`);

        setSearch((prev) => ({
          ...prev,
          ...locationParams,
          userCoordinates: search.searchCoordinates,
        }));
      });
    },
    [
      appConfig.search.hybridSemanticSearchEnabled,
      findCode,
      locations,
      requireUserLocation,
      router,
      search,
      setSearch,
      stringifySearchParams,
    ],
  );

  useEffect(() => {
    if (!isPending) {
      setOpen?.(false);
    }
  }, [isPending, setOpen]);

  const handleOpenAutoFocus = useCallback(
    (event: Event) => {
      const inputId =
        focusByDefault === 'location' ? LOCATION_INPUT_ID : SEARCH_INPUT_ID;
      const input = document.getElementById(inputId);

      if (!input) return;

      event.preventDefault();
      input.focus();
    },
    [focusByDefault],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        id={SEARCH_DIALOG_ID}
        data-testid="search-dialog"
        withClose={false}
        onOpenAutoFocus={handleOpenAutoFocus}
        className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-6 overflow-y-auto rounded-none border-0 p-6 duration-300 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('header.search')}</DialogTitle>
          <DialogDescription>
            {t('search.search_dialog_description', {
              defaultValue: 'Search for resources and update your location.',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-[25rem] flex-col gap-4 sm:mt-[120px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              type="button"
              className="self-start"
              variant="highlight"
              onClick={() => setOpen?.(false)}
            >
              <ChevronLeft className="size-4 text-primary" aria-hidden="true" />
              {t('search.back')}
            </Button>
            <SearchButton loading={isPending} />
          </div>
          <SearchBar inputId={SEARCH_INPUT_ID} />
          <LocationSearchBar
            inputId={LOCATION_INPUT_ID}
            enterKeyFocusTargetId={SEARCH_INPUT_ID}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
