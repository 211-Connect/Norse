'use client';

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

  useEffect(() => {
    createResultsEvent({ results, total: totalResults }, searchParamsObject);
  }, [results, searchParamsObject, totalResults]);

  return null;
};
