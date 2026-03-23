'use client';

import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { noResultsAtom } from '@/app/(app)/shared/store/results';
import { PrintButton } from '@/app/(app)/shared/components/print-button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';

import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';
import { ResultsPagination } from './results-pagination';
import { SortSelect } from './sort-select';

export function ResultsSection() {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const noResults = useAtomValue(noResultsAtom);

  return (
    <div
      id="search-container"
      className="flex w-full flex-col gap-3 overflow-y-auto p-[10px] xl:max-w-[550px]"
    >
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex items-center justify-between">
          <ResultTotal />
          <div className="flex gap-[10px]">
            {!noResults && (
              <PrintButton componentToPrintRef={componentToPrintRef} />
            )}
            <ShareButton componentToPrintRef={componentToPrintRef} />
          </div>
        </div>
        {!noResults && <SortSelect />}
      </div>

      <div className="flex flex-col gap-6" ref={componentToPrintRef}>
        <RenderResults />
        <ResultsPagination />
      </div>
    </div>
  );
}
