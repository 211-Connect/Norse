'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import {
  resultsAtom,
  resultTotalAtom,
  resultsCurrentPageAtom,
} from '@/app/(app)/shared/store/results';
import { PrintButton } from '@/app/(app)/shared/components/print-button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';

import { ResultTotal } from './result-total';
import { RenderResults } from './render-results';
import { ResultsPagination } from './results-pagination';
import { SortSelect } from './sort-select';
import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { queryTypeAtom } from '@/app/(app)/shared/store/search';

const SEARCH_RESULTS_HEADING_ID = 'search-results-heading';
const PENDING_FOCUS_TARGET_STORAGE_KEY = 'pending-search-focus-target';

type ResultsSectionProps = {
  cardLayout: SearchCardLayoutConfig;
};

export function ResultsSection({ cardLayout }: ResultsSectionProps) {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const results = useAtomValue(resultsAtom);
  const totalResults = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);
  const queryType = useAtomValue(queryTypeAtom);

  const showSort = queryType !== 'hybrid';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pendingTarget = window.sessionStorage.getItem(
      PENDING_FOCUS_TARGET_STORAGE_KEY,
    );

    if (pendingTarget !== SEARCH_RESULTS_HEADING_ID) return;

    window.sessionStorage.removeItem(PENDING_FOCUS_TARGET_STORAGE_KEY);
    resultsHeadingRef.current?.focus({ preventScroll: true });
    resultsHeadingRef.current?.scrollIntoView({ block: 'start' });
  }, [currentPage, results.length, totalResults]);

  return (
    <section
      id="search-container"
      aria-labelledby={SEARCH_RESULTS_HEADING_ID}
      className="flex w-full flex-col gap-3 overflow-y-auto p-[10px] lg:max-w-[400px] xl:max-w-[550px]"
    >
      <h2
        id={SEARCH_RESULTS_HEADING_ID}
        ref={resultsHeadingRef}
        className="sr-only"
        tabIndex={-1}
      >
        Search Results
      </h2>
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex items-center justify-between">
          <ResultTotal />
          <div className="flex gap-[10px]">
            {results.length > 0 && (
              <PrintButton componentToPrintRef={componentToPrintRef} />
            )}
            <ShareButton componentToPrintRef={componentToPrintRef} />
          </div>
        </div>
        {showSort && <SortSelect />}
      </div>

      <div className="flex flex-col gap-6" ref={componentToPrintRef}>
        <RenderResults cardLayout={cardLayout} />
        <ResultsPagination />
      </div>
    </section>
  );
}
