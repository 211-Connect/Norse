'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

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
  ) => Promise<T>,
) {
  return function useAsyncData(): AsyncData<T> {
    const { range, tenantId, websiteIds } = useAnalyticsParams();
    const [state, setState] = useState<AsyncData<T>>({
      loading: true,
      error: null,
      data: null,
    });

    useEffect(() => {
      let cancelled = false;

      if (!tenantId) {
        setState({ loading: false, error: null, data: null });
        return;
      }

      setState({ loading: true, error: null, data: null });
      fetcher(range, tenantId, websiteIds)
        .then((data) => {
          if (!cancelled) setState({ loading: false, error: null, data });
        })
        .catch((err) => {
          if (!cancelled)
            setState({
              loading: false,
              error: err instanceof Error ? err.message : String(err),
              data: null,
            });
        });
      return () => {
        cancelled = true;
      };
    }, [range, tenantId, websiteIds]);

    return state;
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
  const [state, setState] = useState<AsyncData<EventDataValuesData>>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!tenantId || !event || !propertyName) {
      setState({ loading: false, error: null, data: null });
      return;
    }

    setState({ loading: true, error: null, data: null });
    fetchEventDataValues(range, tenantId, websiteIds, { event, propertyName })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : String(err),
            data: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, tenantId, websiteIds, event, propertyName]);

  return state;
}
