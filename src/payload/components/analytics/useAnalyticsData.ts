'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  analyticsDateRangeAtom,
  analyticsSelectedWebsiteIdsAtom,
} from './DateRange';
import {
  fetchAreaSearchMetrics,
  fetchEventDataValues,
  fetchEvents,
  fetchLanguageSwitchDestinations,
  fetchMetrics,
  fetchPageviews,
  fetchPaths,
  fetchResourceByEntry,
  fetchSessionHeatmap,
  fetchSessions,
  fetchStats,
  fetchZeroResultQueries,
} from './analyticsCache';
import {
  AreaSearchMetricsData,
  DateRange,
  EventDataValuesData,
  EventsData,
  LanguageSwitchDestinationsData,
  MetricsData,
  PathsData,
  ResourceByEntryData,
  SessionHeatmapData,
  SessionsData,
  UmamiPageviews,
  UmamiStats,
  ZeroResultQueriesData,
} from './types';

export type AsyncData<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  refetch: () => void;
};

function useAnalyticsParams(): {
  range: DateRange;
  tenantId: string | undefined;
  websiteIds: string[];
} {
  const range = useAtomValue(analyticsDateRangeAtom);
  const websiteIds = useAtomValue(analyticsSelectedWebsiteIdsAtom);
  const { selectedTenantID } = useTenantSelection();
  return {
    range,
    tenantId: selectedTenantID as string | undefined,
    websiteIds,
  };
}

function makeAsyncHook<T>(
  fetcher: (
    range: DateRange,
    tenantId: string | undefined,
    websiteIds?: string[],
    force?: boolean,
  ) => Promise<T>,
) {
  return function useAsyncData(): AsyncData<T> {
    const { range, tenantId, websiteIds } = useAnalyticsParams();
    const [state, setState] = useState<Omit<AsyncData<T>, 'refetch'>>({
      loading: true,
      error: null,
      data: null,
    });

    const paramsRef = useRef({ range, tenantId, websiteIds });
    paramsRef.current = { range, tenantId, websiteIds };

    const requestIdRef = useRef(0);

    const load = useCallback((force: boolean) => {
      const requestId = ++requestIdRef.current;
      const {
        range: currentRange,
        tenantId: currentTenantId,
        websiteIds: currentWebsiteIds,
      } = paramsRef.current;

      if (!currentTenantId) {
        setState({ loading: false, error: null, data: null });
        return;
      }

      setState({ loading: true, error: null, data: null });
      fetcher(currentRange, currentTenantId, currentWebsiteIds, force)
        .then((data) => {
          if (requestIdRef.current === requestId) {
            setState({ loading: false, error: null, data });
          }
        })
        .catch((err) => {
          if (requestIdRef.current === requestId) {
            setState({
              loading: false,
              error: err instanceof Error ? err.message : String(err),
              data: null,
            });
          }
        });
    }, []);

    useEffect(() => {
      load(false);
    }, [range, tenantId, websiteIds, load]);

    return {
      ...state,
      refetch: () => load(true),
    };
  };
}

export const useStats = makeAsyncHook<UmamiStats>(fetchStats);
export const usePageviews = makeAsyncHook<UmamiPageviews>(fetchPageviews);
export const useMetrics = makeAsyncHook<MetricsData>(fetchMetrics);
export const usePaths = makeAsyncHook<PathsData>(fetchPaths);
export const useEvents = makeAsyncHook<EventsData>(fetchEvents);
export const useZeroResultQueries = makeAsyncHook<ZeroResultQueriesData>(
  fetchZeroResultQueries,
);
export const useLanguageSwitchDestinations =
  makeAsyncHook<LanguageSwitchDestinationsData>(
    fetchLanguageSwitchDestinations,
  );
export const useSessions = makeAsyncHook<SessionsData>(fetchSessions);
export const useSessionHeatmap =
  makeAsyncHook<SessionHeatmapData>(fetchSessionHeatmap);
export const useResourceByEntry =
  makeAsyncHook<ResourceByEntryData>(fetchResourceByEntry);
export const useAreaSearchMetrics = makeAsyncHook<AreaSearchMetricsData>(
  fetchAreaSearchMetrics,
);

export function useEventDataValues(
  event: string,
  propertyName: string,
): AsyncData<EventDataValuesData> {
  const { range, tenantId, websiteIds } = useAnalyticsParams();
  const [state, setState] = useState<
    Omit<AsyncData<EventDataValuesData>, 'refetch'>
  >({
    loading: true,
    error: null,
    data: null,
  });

  const paramsRef = useRef({
    range,
    tenantId,
    websiteIds,
    event,
    propertyName,
  });
  paramsRef.current = { range, tenantId, websiteIds, event, propertyName };

  const requestIdRef = useRef(0);

  const load = useCallback((force: boolean) => {
    const requestId = ++requestIdRef.current;
    const {
      range: currentRange,
      tenantId: currentTenantId,
      websiteIds: currentWebsiteIds,
      event: currentEvent,
      propertyName: currentPropertyName,
    } = paramsRef.current;

    if (!currentTenantId || !currentEvent || !currentPropertyName) {
      setState({ loading: false, error: null, data: null });
      return;
    }

    setState({ loading: true, error: null, data: null });
    fetchEventDataValues(
      currentRange,
      currentTenantId,
      currentWebsiteIds,
      { event: currentEvent, propertyName: currentPropertyName },
      force,
    )
      .then((data) => {
        if (requestIdRef.current === requestId) {
          setState({ loading: false, error: null, data });
        }
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : String(err),
            data: null,
          });
        }
      });
  }, []);

  useEffect(() => {
    load(false);
  }, [range, tenantId, websiteIds, event, propertyName, load]);

  return {
    ...state,
    refetch: () => load(true),
  };
}
