'use client';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { createResultsEvent } from '@/app/(app)/shared/lib/google-tag-manager';
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

  return null;
};
