'use client';

import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getPrintableDirectoryData } from '@/app/(app)/shared/serverActions/search/getPrintableDirectoryData';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import {
  Alert,
  AlertDescription,
} from '@/app/(app)/shared/components/ui/alert';
import {
  resultTotalAtom,
  resultsAtom,
  resultsCurrentPageAtom,
} from '@/app/(app)/shared/store/results';
import {
  queryAtom,
  queryLabelAtom,
  queryTypeAtom,
} from '@/app/(app)/shared/store/search';

import { SearchCardLayoutConfig } from '../types/card-layout-config';
import { RenderResults } from './render-results';
import { ResultTotal } from './result-total';
import { ResultsPagination } from './results-pagination';
import { SortSelect } from './sort-select';

const SEARCH_RESULTS_HEADING_ID = 'search-results-heading';
const PENDING_FOCUS_TARGET_STORAGE_KEY = 'pending-search-focus-target';

type ResultsSectionProps = {
  cardLayout: SearchCardLayoutConfig;
  showAiBroadenedResultsAlert?: boolean;
};

export function ResultsSection({
  cardLayout,
  showAiBroadenedResultsAlert = false,
}: ResultsSectionProps) {
  const { t } = useTranslation('page-search');
  const { i18n } = useTranslation();
  const appConfig = useAppConfig();
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const results = useAtomValue(resultsAtom);
  const resultsCount = results?.length ?? 0;
  const totalResults = useAtomValue(resultTotalAtom);
  const currentPage = useAtomValue(resultsCurrentPageAtom);
  const query = useAtomValue(queryAtom);
  const queryLabel = useAtomValue(queryLabelAtom);
  const queryType = useAtomValue(queryTypeAtom);
  const shareTitle = queryLabel || query || t('no_query');
  const shareBody = t('share_body', { count: totalResults, title: shareTitle });
  const printableListName = shareTitle;

  const showSort = queryType !== 'hybrid';

  const loadPrintableData = useCallback(async () => {
    const ids = (results ?? [])
      .map((result) => result.id || result._id)
      .filter(Boolean);

    return getPrintableDirectoryData(
      ids,
      i18n.language,
      appConfig.tenantId,
      printableListName,
    );
  }, [results, i18n.language, appConfig.tenantId, printableListName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pendingTarget = window.sessionStorage.getItem(
      PENDING_FOCUS_TARGET_STORAGE_KEY,
    );

    if (pendingTarget !== SEARCH_RESULTS_HEADING_ID) return;

    window.sessionStorage.removeItem(PENDING_FOCUS_TARGET_STORAGE_KEY);
    resultsHeadingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [currentPage, resultsCount, totalResults]);

  return (
    <section
      id="search-container"
      aria-labelledby={SEARCH_RESULTS_HEADING_ID}
      className="flex w-full flex-col gap-3 overflow-y-auto p-2.5 lg:max-w-100 xl:max-w-137.5"
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
        {showAiBroadenedResultsAlert && (
          <Alert>
            <AlertDescription>
              {t('ai_broadened_results_alert')}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
          <ResultTotal />
          <div className="flex gap-2.5">
            {resultsCount > 0 && (
              <DirectoryPrintControl data={null} loadData={loadPrintableData} />
            )}
            <ShareButton
              componentToPrintRef={componentToPrintRef}
              title={shareTitle}
              body={shareBody}
            />
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
