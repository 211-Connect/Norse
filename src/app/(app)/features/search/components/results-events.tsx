'use client';

import { useEffect } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { createResultsEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { UmamiEvent, trackUmamiEvent } from '@/app/(app)/shared/lib/umami';

interface ResultsEventsProps {
  results: any;
  totalResults: any;
}

export const ResultsEvents = ({
  results,
  totalResults,
}: ResultsEventsProps) => {
  const { searchParamsObject } = useClientSearchParams();
  const appConfig = useAppConfig();

  useEffect(() => {
    createResultsEvent(
      { results, total: totalResults },
      searchParamsObject,
      appConfig.sessionId,
    );

    if (totalResults === 0) {
      trackUmamiEvent(UmamiEvent.SearchZeroResults, {
        query: String(searchParamsObject.query ?? ''),
        query_label: String(searchParamsObject.query_label ?? ''),
      });
    }
  }, [
    appConfig.sessionId,
    appConfig.tenantId,
    results,
    searchParamsObject,
    totalResults,
  ]);

  return null;
};
