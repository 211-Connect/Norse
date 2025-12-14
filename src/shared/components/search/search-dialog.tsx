import { useCallback, useEffect, useRef, useState } from 'react';
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
import { cn, getScrollbarWidth } from '@/shared/lib/utils';
import { createPortal } from 'react-dom';

const SEARCH_INPUT_ID = 'search-input';
const LOCATION_INPUT_ID = 'location-input';

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

  const scrollPositionRef = useRef(0);
  const initialRenderRef = useRef(true);

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    if (!loading) {
      setOpen?.(false);
    }
  }, [loading, setOpen]);

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
            className="flex w-full max-w-[400px] flex-col gap-4 sm:mt-[120px]"
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
              <SearchButton loading={loading} />
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
