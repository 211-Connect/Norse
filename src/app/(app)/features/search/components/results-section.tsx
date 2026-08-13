'use client';

import { useAtomValue } from 'jotai';
import { useSearchParams } from 'next/navigation';
import qs from 'qs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { useDefaultDirectoryPdfDocument } from '@/app/(app)/shared/components/directory-print/use-default-directory-pdf-document';
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
import { SaveQueryToDirectoryButton } from './save-query-to-directory-button';

const SEARCH_RESULTS_HEADING_ID = 'search-results-heading';
const PENDING_FOCUS_TARGET_STORAGE_KEY = 'pending-search-focus-target';

export type AiAlertType = 'low_info' | 'low_confidence' | 'general';

type ResultsSectionProps = {
  cardLayout: SearchCardLayoutConfig;
  aiSearchAlert?: string;
};

const getAiAlertMessageKey = (aiSearchAlert?: string): string | undefined => {
  if (aiSearchAlert === 'low_info') {
    return 'ai_broadened_results_alert_low_info';
  }

  if (aiSearchAlert === 'low_confidence') {
    return 'ai_broadened_results_alert_low_confidence';
  }

  if (aiSearchAlert) {
    return 'ai_broadened_results_alert';
  }

  return undefined;
};

const toSingleString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
};

const parseDistanceParam = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
};

export function ResultsSection({
  cardLayout,
  aiSearchAlert,
}: ResultsSectionProps) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const searchParams = useSearchParams();
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
  const aiAlertMessageKey = getAiAlertMessageKey(aiSearchAlert);
  const serializedQueryParams = useMemo(() => {
    const parsedParams = qs.parse(searchParams.toString());
    const parsedDistance = parseDistanceParam(
      toSingleString(parsedParams.distance),
    );
    const parsedFilters =
      parsedParams.filters &&
      typeof parsedParams.filters === 'object' &&
      !Array.isArray(parsedParams.filters)
        ? (parsedParams.filters as Record<string, unknown>)
        : undefined;

    const nextParams: Record<string, unknown> = {
      query: toSingleString(parsedParams.query) || query || '',
      query_label: toSingleString(parsedParams.query_label) || queryLabel || '',
      query_type: toSingleString(parsedParams.query_type) || queryType || '',
      coords: toSingleString(parsedParams.coords) || '',
      location: toSingleString(parsedParams.location) || '',
    };

    if (parsedDistance !== undefined) {
      nextParams.distance = parsedDistance;
    }

    if (parsedFilters) {
      nextParams.filters = parsedFilters;
    }

    return nextParams;
  }, [searchParams, query, queryLabel, queryType]);

  const showSort = queryType !== 'hybrid';

  const loadPrintableData = useCallback(
    (locale: string) => {
      const ids = (results ?? [])
        .map((result) => result.id || result._id)
        .filter(Boolean);

      return getPrintableDirectoryData(
        ids,
        locale,
        appConfig.tenantId,
        printableListName,
      );
    },
    [results, appConfig.tenantId, printableListName],
  );
  const renderPdfDocument = useDefaultDirectoryPdfDocument();

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
        {aiAlertMessageKey && (
          <Alert>
            <AlertDescription>{t(aiAlertMessageKey)}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
          <ResultTotal />
          <div className="flex gap-2.5">
            {resultsCount > 0 && (
              <DirectoryPrintControl
                loadData={loadPrintableData}
                renderDocument={renderPdfDocument}
              />
            )}
            {resultsCount > 0 && (
              <SaveQueryToDirectoryButton
                queryTitle={shareTitle}
                queryParams={serializedQueryParams}
              />
            )}
            <ShareButton title={shareTitle} body={shareBody} />
          </div>
        </div>
        {showSort && <SortSelect />}
      </div>

      <div className="flex flex-col gap-6">
        <RenderResults cardLayout={cardLayout} />
        <ResultsPagination />
      </div>
    </section>
  );
}
