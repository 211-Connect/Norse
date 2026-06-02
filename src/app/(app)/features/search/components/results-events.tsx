'use client';

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { createResultsEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { UmamiEvent, trackUmamiEvent } from '@/app/(app)/shared/lib/umami';
import {
  searchCoordinatesAtom,
  userCoordinatesAtom,
} from '@/app/(app)/shared/store/search';

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
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);

  useEffect(() => {
    let isCancelled = false;

    createResultsEvent(
      { results, total: totalResults },
      searchParamsObject,
      appConfig.sessionId,
    );

    const trackZeroResults = async () => {
      if (totalResults !== 0) {
        return;
      }

      const locationPayload = await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      );

      if (isCancelled) {
        return;
      }

      trackUmamiEvent(UmamiEvent.SearchZeroResults, {
        query: String(searchParamsObject.query ?? ''),
        query_label: String(searchParamsObject.query_label ?? ''),
        ...locationPayload,
      });
    };

    void trackZeroResults();

    return () => {
      isCancelled = true;
    };
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
