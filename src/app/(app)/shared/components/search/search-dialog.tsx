'use client';

import { deleteCookie, setCookie } from 'cookies-next/client';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  SubmitEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../../hooks/use-app-config';
import { useClientSearchParams } from '../../hooks/use-client-search-params';
import { useFlag } from '../../hooks/use-flag';
import {
  LOCATION_INPUT_ID,
  SEARCH_DIALOG_DESCRIPTION_ID,
  SEARCH_DIALOG_ID,
  SEARCH_DIALOG_TITLE_ID,
  SEARCH_INPUT_ID,
  USER_PREF_DISTANCE,
} from '../../lib/constants';
import { UmamiEvent, trackUmamiEvent } from '../../lib/umami';
import { cn, getScrollbarWidth } from '../../lib/utils';
import {
  searchCoordinatesAtom,
  searchDistanceAtom,
  userCoordinatesAtom,
} from '../../store/search';
import { createUrlParamsForSearch } from '../../utils/createUrlParamsForSearch';
import { Button } from '../ui/button';
import { LocationSearchBar } from './location-search-bar';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';
import { SearchBar } from './search-bar';
import { SearchButton } from './search-button';

export interface SearchDialogProps {
  focusByDefault?: 'search' | 'location';
  open: boolean;
  setOpen?: (open: boolean) => void;
  restoreFocusElement?: HTMLElement | null;
}

export function SearchDialog({
  focusByDefault = 'search',
  open,
  setOpen,
  restoreFocusElement,
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const distance = useAtomValue(searchDistanceAtom);

  const { search, setSearch } = useMainSearchLayoutContext();
  const setUserCoordinates = useSetAtom(userCoordinatesAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);

  useEffect(() => {
    if (!open || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoordinates([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {
        setUserCoordinates(searchCoordinates);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, [open, setUserCoordinates, searchCoordinates]);

  const userCoordinates = useAtomValue(userCoordinatesAtom);

  const onSubmit: SubmitEventHandler<HTMLFormElement> = useCallback(
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

        const query = search.query || search.searchTerm;

        const hasCoordinates = search.searchCoordinates.length === 2;
        const locationParams = hasCoordinates
          ? {
              searchLocation: search.searchLocation,
              searchCoordinates: search.searchCoordinates,
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
        if (distance === '0') {
          deleteCookie(USER_PREF_DISTANCE, { path: '/' });
        } else {
          setCookie(USER_PREF_DISTANCE, distance, { path: '/' });
        }

        const effectiveQueryType = search.queryType;

        const umamiPayload = {
          query: String(query ?? ''),
          queryLabel: String(search.queryLabel ?? ''),
          tenantId: appConfig.tenantId ?? '',
          userCoordinates: userCoordinates.join(',') ?? '',
          searchCoordinates: searchCoordinates.join(',') ?? '',
        };

        if (effectiveQueryType === 'text') {
          trackUmamiEvent(UmamiEvent.SearchText, umamiPayload);
        }

        if (effectiveQueryType === 'taxonomy') {
          trackUmamiEvent(UmamiEvent.SearchTaxonomy, umamiPayload);
        }

        router.push(`/search${queryParams}`);

        // Close as soon as navigation is requested so `open` / aria-expanded match
        // real interactivity (dialog must not sit above the results page).
        setOpen?.(false);

        setSearch((prev) => ({
          ...prev,
          ...locationParams,
        }));
      });
    },
    [
      appConfig.search.hybridSemanticSearchEnabled,
      appConfig.tenantId,
      requireUserLocation,
      router,
      search,
      searchCoordinates,
      distance,
      userCoordinates,
      setOpen,
      setSearch,
      stringifySearchParams,
    ],
  );

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

  const closeDialog = useCallback(() => {
    setOpen?.(false);

    if (restoreFocusElement) {
      setTimeout(() => {
        restoreFocusElement.focus({ preventScroll: true });
      }, 20);
    }
  }, [restoreFocusElement, setOpen]);

  const handleDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((element) => {
        return (
          element.getAttribute('aria-hidden') !== 'true' &&
          !element.hasAttribute('disabled') &&
          element.tabIndex !== -1
        );
      });

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    },
    [closeDialog],
  );

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
      ref={dialogRef}
      id={SEARCH_DIALOG_ID}
      className={cn(
        'fixed bottom-0 left-0 right-0 top-0 z-50 bg-white p-6 transition-opacity duration-300',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      role="dialog"
      data-testid={SEARCH_DIALOG_ID}
      aria-hidden={open ? undefined : true}
      aria-modal={open ? true : undefined}
      aria-labelledby={SEARCH_DIALOG_TITLE_ID}
      aria-describedby={SEARCH_DIALOG_DESCRIPTION_ID}
      onKeyDown={handleDialogKeyDown}
    >
      <h2 className="sr-only" id={SEARCH_DIALOG_TITLE_ID}>
        {t('header.search')}
      </h2>
      <p className="sr-only" id={SEARCH_DIALOG_DESCRIPTION_ID}>
        {t('search.search_dialog_description')}
      </p>
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
                onClick={closeDialog}
              >
                <ChevronLeft className="size-4 text-primary" />
                {t('search.back')}
              </Button>
              <SearchButton loading={isPending} />
            </div>
            <div id="search-form-inputs">
              <SearchBar inputId={SEARCH_INPUT_ID} />
              <LocationSearchBar inputId={LOCATION_INPUT_ID} className="mt-4" />
            </div>
          </form>
        )}
      </div>
    </div>,
    document.querySelector('#app-root') as Element,
  );
}
