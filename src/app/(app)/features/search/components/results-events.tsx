'use client';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { createResultsEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { trackUmamiEvent, UmamiEvent } from '@/app/(app)/shared/lib/umami';
import { useEffect } from 'react';

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
  }, [appConfig.sessionId, results, searchParamsObject, totalResults]);

  // // Try to remove useEffect
  // useEffect(() => {
  //   if (totalResults === 0) {
  //     trackUmamiEvent(UmamiEvent.SearchZeroResults, {
  //       query: String(searchParamsObject.query ?? ''),
  //       query_label: String(searchParamsObject.query_label ?? ''),
  //     });
  //   }
  // }, [totalResults, searchParamsObject]);

  // Try to remove useEffect

  if (totalResults === 0) {
    trackUmamiEvent(UmamiEvent.SearchZeroResults, {
      query: String(searchParamsObject.query ?? ''),
      query_label: String(searchParamsObject.query_label ?? ''),
    });
  }

  return null;
};
