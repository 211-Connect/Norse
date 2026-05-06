'use client';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { createResultsEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { trackUmamiEvent, UmamiEvent } from '@/app/(app)/shared/lib/umami';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import {
  searchCoordinatesAtom,
  userCoordinatesAtom,
} from '../../../shared/store/search';

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

  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);

  useEffect(() => {
    createResultsEvent(
      { results, total: totalResults },
      searchParamsObject,
      appConfig.sessionId,
    );

    const payload = {
      userCoordinates: userCoordinates.join(',') ?? '',
      searchCoordinates: searchCoordinates.join(',') ?? '',
      query: String(searchParamsObject.query ?? ''),
      queryLabel: String(searchParamsObject.query_label ?? ''),
      tenantId: appConfig.tenantId ?? '',
    };

    if (searchParamsObject.query_type === 'taxonomy') {
      console.log('Tracking taxonomy search click with payload:', payload);
      trackUmamiEvent(UmamiEvent.SearchTaxonomy, payload);
    }

    if (searchParamsObject.query_type === 'text') {
      console.log('Tracking text search click with payload:', payload);
      trackUmamiEvent(UmamiEvent.SearchText, payload);
    }

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
    searchCoordinates,
    searchParamsObject,
    totalResults,
    userCoordinates,
  ]);

  return null;
};
