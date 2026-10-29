'use client';

import { useCallback, useState } from 'react';

import type { SearchIntent } from '@/app/(app)/features/search/intent';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/intent';

import { FilterPanel } from './filter/filter-panel';
import { MapContainer } from './map-container';
import { ResultsSection } from './results-section';

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

  const handleLegacyDialogClose = useCallback(() => {
    setHideSupplementaryContent(false);
  }, []);

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
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
          />
          <MapContainer />
        </>
      )}
    </div>
  );
}
