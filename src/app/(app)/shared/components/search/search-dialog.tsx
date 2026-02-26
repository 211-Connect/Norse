'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft } from 'lucide-react';

import { LocationSearchBar } from './location-search-bar';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import { useFlag } from '../../hooks/use-flag';
import { useAppConfig } from '../../hooks/use-app-config';
import { createUrlParamsForSearch } from '../../services/search-service';
import { useRouter } from 'next/navigation';
import { useClientSearchParams } from '../../hooks/use-client-search-params';
import { cn, getScrollbarWidth } from '../../lib/utils';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  open: boolean;
  setOpen?: (open: boolean) => void;
}

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

  const scrollPositionRef = useRef(0);
  const initialRenderRef = useRef(true);

  const [mounted, setMounted] = useState(false);

  const { findCode, getQueryType, locations, search, setSearch } =
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

        let query = findCode(search.searchTerm);
        const queryType = getQueryType(search.searchTerm, query);

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

        const urlParams = createUrlParamsForSearch(
          {
            ...search,
            ...locationParams,
            query: query || '',
            queryType: queryType,
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
      findCode,
      getQueryType,
      locations,
      requireUserLocation,
      router,
      search,
      setSearch,
      stringifySearchParams,
      appConfig.search.hybridSemanticSearchEnabled,
    ],
  );

  useEffect(() => {
    if (!isPending) {
      setOpen?.(false);
    }
  }, [isPending, setOpen]);

  useEffect(() => {
    if (initialRenderRef.current) return;

    if (open) {
      const elementToSelect =
        focusByDefault === 'location' ? LOCATION_INPUT_ID : SEARCH_INPUT_ID;

      const scrollbarWidth = getScrollbarWidth();
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      setTimeout(() => {
        (
          document.querySelector(`#${elementToSelect}`) as
            | HTMLInputElement
            | undefined
        )?.focus();
      }, 100);
    } else {
      setTimeout(() => {
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.position = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollPositionRef.current || 0);
      }, 10);
    }
  }, [focusByDefault, open]);

  useEffect(() => {
    initialRenderRef.current = false;
    setMounted(true);

    return () => {
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.position = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, 0);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 top-0 z-50 bg-white p-6 transition-opacity duration-300',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      role="dialog"
    >
      <h2 className="sr-only">Search</h2>
      <div className="flex h-full w-full max-w-full justify-center !rounded-none border-0">
        {open && (
          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-[25rem] flex-col gap-4 sm:mt-[120px]"
          >
            <div className="flex flex-row justify-between gap-4">
              <Button
                type="button"
                className="self-start"
                variant="highlight"
                onClick={() => setOpen?.(false)}
              >
                <ChevronLeft className="size-4 text-primary" />
                {t('search.back')}
              </Button>
              <SearchButton loading={isPending} />
            </div>
            <SearchBar inputId={SEARCH_INPUT_ID} />
            <LocationSearchBar inputId={LOCATION_INPUT_ID} />
          </form>
        )}
      </div>
    </div>,
    document.querySelector('#app-root') as Element,
  );
}
