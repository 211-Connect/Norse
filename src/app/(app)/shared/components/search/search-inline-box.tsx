'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, MapPin } from 'lucide-react';
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
  locationAside,
}: {
  belowSearch?: ReactNode;
  className?: string;
  /** Sits at the right end of the location row. */
  locationAside?: ReactNode;
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
  const navigate = useNavigateAiSearch({ startTransition });
  const locationRef = useRef<HTMLDivElement>(null);
  useDismissOutside(locationRef, editingLocation, () =>
    setEditingLocation(false),
  );

  const setCleared = useSetAtom(searchClearedAtom);

  const onChange = (value: string) => {
    if (!value.trim()) setCleared(true);
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
    if (!query || isBusy) return;
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
      setEditingLocation(false);
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <form
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
          className="border-control-border focus:border-primary block max-h-40 min-h-14 w-full resize-none rounded-lg border bg-white py-3 pr-14 pl-4 text-base shadow-sm outline-none focus:outline-none focus-visible:outline-none md:min-h-16"
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
      {belowSearch}
      {editingLocation ? (
        <div className="mt-2 w-full" ref={locationRef}>
          <LocationSearchBar inputId={LOCATION_INPUT_ID} className="w-full" />
        </div>
      ) : (
        <div className="mt-2 flex w-full items-center justify-between gap-3">
          <button
            type="button"
            className="text-primary flex cursor-pointer items-center gap-1.5 text-sm font-medium"
            onClick={() => setEditingLocation(true)}
          >
            <MapPin className="size-4" aria-hidden="true" />
            {searchLocation || 'Add your location'}
          </button>
          {locationAside}
        </div>
      )}
    </div>
  );
}
