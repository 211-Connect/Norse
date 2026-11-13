'use client';

import { useAtomValue } from 'jotai';
import { Phone } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { SearchIntent } from '@/app/(app)/features/search/intent';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/intent';
import { useBreakpoint } from '@/app/(app)/shared/hooks/use-breakpoint';
import { resultsViewAtom } from '@/app/(app)/shared/store/results';

import { useSearchResults } from '../context/search-results-context';
import { FilterPanel } from './filter/filter-panel';
import { MapContainer } from './map-container';
import { ResultsSection } from './results-section';
import { ResultsViewToggle } from './results-view-toggle';

type SearchPageShellProps = {
  aiSearchAlert?: string;
  cardLayout: SearchCardLayoutConfig;
  legacyAiClarifyState?: LegacyAiClarifyState;
  /** The lifted intent: the plain data the client's resolver starts from. */
  searchIntent?: SearchIntent;
};

export function SearchPageShell({
  aiSearchAlert,
  cardLayout,
  legacyAiClarifyState,
  searchIntent,
}: SearchPageShellProps) {
  const [hideSupplementaryContent, setHideSupplementaryContent] = useState(
    Boolean(legacyAiClarifyState?.autoOpenDialog),
  );

  // A phone shows one view at a time, and loads the map only when the person asks for it.
  const wide = useBreakpoint(768);
  const { results } = useSearchResults();
  const mapChosen =
    useAtomValue(resultsViewAtom) === 'map' && results.length > 0;

  const handleLegacyDialogClose = useCallback(() => {
    setHideSupplementaryContent(false);
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Always on, on every search state, also when the classifier fails (ADR 0039 Decision 45). */}
      <p
        className="border-b bg-red-50 px-2.5 py-1 text-sm print:hidden"
        data-testid="always-on-911"
      >
        <a
          href="tel:911"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-red-700 underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          In an emergency, call 911
        </a>
      </p>
    <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
      <FilterPanel
        legacyAiClarifyState={legacyAiClarifyState}
        onLegacyAiClarifyAction={handleLegacyDialogClose}
        searchIntent={searchIntent}
      />
      {!hideSupplementaryContent && (
        <>
          <ResultsSection
            cardLayout={cardLayout}
            aiSearchAlert={aiSearchAlert}
            className={mapChosen ? 'max-md:hidden' : undefined}
          />
          {(wide || mapChosen) && (
            <MapContainer phoneView={mapChosen && !wide} />
          )}
          <ResultsViewToggle />
        </>
      )}
    </div>
    </div>
  );
}
