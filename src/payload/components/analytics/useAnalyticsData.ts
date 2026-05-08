'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { analyticsDateRangeAtom } from './DateRange';
import {
  type EventsData,
  type MetricsData,
  type PathsData,
  type SessionsData,
  fetchEvents,
  fetchMetrics,
  fetchPageviews,
  fetchPaths,
  fetchSessions,
  fetchStats,
} from './analyticsCache';
import type { DateRange } from './types';
import type { UmamiPageviews, UmamiStats } from './types';

export type { MetricsData, PathsData, EventsData, SessionsData };

export type AsyncData<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

function useAnalyticsParams(): {
  range: DateRange;
  tenantId: string | undefined;
} {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  return { range, tenantId: selectedTenantID as string | undefined };
}

function makeAsyncHook<T>(
  fetcher: (range: DateRange, tenantId: string | undefined) => Promise<T>,
) {
  return function useAsyncData(): AsyncData<T> {
    const { range, tenantId } = useAnalyticsParams();
    const [state, setState] = useState<AsyncData<T>>({
      loading: true,
      error: null,
      data: null,
    });

    useEffect(() => {
      let cancelled = false;
      setState({ loading: true, error: null, data: null });
      fetcher(range, tenantId)
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
    }, [range, tenantId]);

    return state;
  };
}

export const useStats = makeAsyncHook<UmamiStats>(fetchStats);
export const usePageviews = makeAsyncHook<UmamiPageviews>(fetchPageviews);
export const useMetrics = makeAsyncHook<MetricsData>(fetchMetrics);
export const usePaths = makeAsyncHook<PathsData>(fetchPaths);
export const useEvents = makeAsyncHook<EventsData>(fetchEvents);
export const useSessions = makeAsyncHook<SessionsData>(fetchSessions);
