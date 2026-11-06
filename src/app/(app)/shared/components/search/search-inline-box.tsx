'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, MapPin, Search } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { searchClearedAtom } from '@/app/(app)/features/search/components/search-follow-up';
import { useNavigateAiSearch } from '@/app/(app)/features/search/hooks';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { predictSearchNeeds } from '@/app/(app)/shared/services/ai-classification-search-service';

import { useAppConfig } from '../../hooks/use-app-config';
import { useDismissOutside } from '../../hooks/use-dismiss-outside';
import { LOCATION_INPUT_ID, SEARCH_INPUT_ID } from '../../lib/constants';
import { cn } from '../../lib/utils';
import {
  searchCoordinatesAtom,
  searchLocationAtom,
  searchTermAtom,
  userCoordinatesAtom,
} from '../../store/search';
import { LocationSearchBar } from './location-search-bar';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

/** Prototype: the results page edits the search where it stands. Results stay on screen. */
export function SearchInlineBox({
  belowSearch,
  className,
}: {
  belowSearch?: ReactNode;
  className?: string;
}) {
  const { i18n } = useTranslation('common');
  const appConfig = useAppConfig();
  const { setSearch } = useMainSearchLayoutContext();
  const searchTerm = useAtomValue(searchTermAtom);
  const searchLocation = useAtomValue(searchLocationAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const [isPending, startTransition] = useTransition();
  const [isBusy, setIsBusy] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [emptyError, setEmptyError] = useState(false);
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigateAiSearch({ startTransition });
  const locationRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);
  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setScrolledPast(entry.boundingClientRect.bottom < 0),
    );
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);
  // Tabbing must not land a focused control under the sticky bar or the floating button.
  useEffect(() => {
    const { style } = document.documentElement;
    style.scrollPaddingTop = scrolledPast ? '7rem' : '';
    style.scrollPaddingBottom = '5rem';
    return () => {
      style.scrollPaddingTop = '';
      style.scrollPaddingBottom = '';
    };
  }, [scrolledPast]);
  const closeLocation = () => {
    setEditingLocation(false);
    requestAnimationFrame(() => locationButtonRef.current?.focus());
  };
  const openLocation = () => {
    setEditingLocation(true);
    requestAnimationFrame(() =>
      document.getElementById(LOCATION_INPUT_ID)?.focus(),
    );
  };
  useDismissOutside(locationRef, editingLocation, () =>
    setEditingLocation(false),
  );

  const setCleared = useSetAtom(searchClearedAtom);

  const onChange = (value: string) => {
    if (!value.trim()) setCleared(true);
    setEmptyError(false);
    setSearch((prev) => ({
      ...prev,
      query: value,
      queryType: 'text',
      organizationId: '',
      href: '',
      target: '',
      searchTerm: value,
      queryLabel: value,
    }));
  };

  const submit = async () => {
    const query = searchTerm.trim();
    if (!query) return setEmptyError(true);
    if (isBusy) return;
    setIsBusy(true);
    setCleared(false);
    const prediction = await predictSearchNeeds(
      { query },
      i18n.language,
      appConfig.tenantId,
    );
    navigate({
      taxonomies: prediction?.hsis_taxonomies,
      locationPayload: await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      ),
    });
    setIsBusy(false);
  };

  // A new place reruns the search, as the dialog's submit would.
  const lastLocation = useRef(searchLocation);
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (editingLocation) {
      closeLocation();
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {scrolledPast && (
        <button
          type="button"
          aria-label={
            searchTerm ? `Edit your search: ${searchTerm}` : 'Search again'
          }
          className="border-control-border fixed inset-x-0 top-0 z-30 flex h-12 cursor-pointer items-center gap-2 border-b bg-white px-4 text-left text-sm shadow-sm print:hidden"
          data-testid="search-sticky-bar"
          onClick={() => {
            window.scrollTo({ top: 0 });
            document
              .getElementById(SEARCH_INPUT_ID)
              ?.focus({ preventScroll: true });
          }}
        >
          <Search className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{searchTerm || 'Search again'}</span>
        </button>
      )}
      <form
        ref={formRef}
        className={cn('relative w-full', className)}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          What do you need help with?
        </label>
        <textarea
          id={SEARCH_INPUT_ID}
          rows={1}
          value={searchTerm}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className="border-control-border focus-visible:ring-primary focus:border-primary block max-h-40 min-h-14 w-full resize-none rounded-lg border bg-white py-3 pr-14 pl-4 text-base shadow-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:outline-none md:min-h-16"
          data-testid="search-inline-input"
        />
        <button
          type="submit"
          aria-label="Search"
          disabled={isBusy || isPending}
          className="bg-primary text-primary-foreground absolute right-2.5 bottom-2.5 flex size-9 cursor-pointer items-center justify-center rounded-lg disabled:opacity-60 md:right-3 md:bottom-3"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      </form>
      {emptyError && (
        <p role="alert" className="text-red-700 text-sm font-semibold">
          Tell us what you need help with first.
        </p>
      )}
      {belowSearch}
      {editingLocation ? (
        <div
          className="w-full"
          ref={locationRef}
          // Capture runs first: the box's own Escape would commit its highlighted row, "Everywhere".
          onKeyDownCapture={(event) => {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            closeLocation();
          }}
        >
          <LocationSearchBar inputId={LOCATION_INPUT_ID} className="w-full" />
        </div>
      ) : (
        <button
          ref={locationButtonRef}
          type="button"
          aria-label={
            searchLocation
              ? `Change location, now ${searchLocation}`
              : 'Add your location'
          }
          className="text-primary flex cursor-pointer items-center gap-1.5 text-sm font-medium"
          onClick={openLocation}
        >
          <MapPin className="size-4" aria-hidden="true" />
          {searchLocation || 'Add your location'}
        </button>
      )}
    </div>
  );
}
