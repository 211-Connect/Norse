'use client';

import { useCallback, useState } from 'react';

import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/utils/parseLegacyAiClarifyParams';

import { FilterPanel } from './filter/filter-panel';
import { MapContainer } from './map-container';
import { ResultsSection } from './results-section';

type SearchPageShellProps = {
  aiSearchAlert?: string;
  cardLayout: SearchCardLayoutConfig;
  legacyAiClarifyState?: LegacyAiClarifyState;
};

export function SearchPageShell({
  aiSearchAlert,
  cardLayout,
  legacyAiClarifyState,
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
