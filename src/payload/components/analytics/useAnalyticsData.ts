'use client';

import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { analyticsDateRangeAtom } from './DateRange';
import {
  type MetricsData,
  type PathsData,
  type EventsData,
  type SessionsData,
  fetchStats,
  fetchPageviews,
  fetchMetrics,
  fetchPaths,
  fetchEvents,
  fetchSessions,
} from './analyticsCache';
import type { DateRange } from './types';
import type { UmamiStats, UmamiPageviews } from './types';

export type { MetricsData, PathsData, EventsData, SessionsData };

export type AsyncData<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

function useAnalyticsParams(): { range: DateRange; tenantId: string | undefined } {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  return { range, tenantId: selectedTenantID as string | undefined };
}

function makeAsyncHook<T>(fetcher: (range: DateRange, tenantId: string | undefined) => Promise<T>) {
  return function useAsyncData(): AsyncData<T> {
    const { range, tenantId } = useAnalyticsParams();
    const [state, setState] = useState<AsyncData<T>>({ loading: true, error: null, data: null });

    useEffect(() => {
      let cancelled = false;
      setState({ loading: true, error: null, data: null });
      fetcher(range, tenantId)
        .then((data) => { if (!cancelled) setState({ loading: false, error: null, data }); })
        .catch((err) => { if (!cancelled) setState({ loading: false, error: err instanceof Error ? err.message : String(err), data: null }); });
      return () => { cancelled = true; };
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
