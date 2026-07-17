'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AnalyticsInfoResponse,
  AreaSearchesResponse,
  EventCatalogEntryResponse,
  EventValuesResponse,
  HeatmapPointResponse,
  LanguageSwitchesResponse,
  PageviewsResponse,
  PaginatedSessionsResponse,
  ResourceByEntryResponse,
  ResourceMetricsResponse,
  SearchesResponse,
  StatsResponse,
  ZeroResultQueriesResponse,
} from '../../../lib/api/generated/data-contracts';

import {
  analyticsDateRangeAtom,
  analyticsSelectedWebsiteIdsAtom,
} from './DateRange';
import {
  AnalyticsMetricsWithTrend,
  fetchAnalyticsAreaSearches,
  fetchAnalyticsEventCatalog,
  fetchAnalyticsEventValues,
  fetchAnalyticsHeatmap,
  fetchAnalyticsInfo,
  fetchAnalyticsLanguageSwitches,
  fetchAnalyticsMetrics,
  fetchAnalyticsPageviews,
  fetchAnalyticsResourceByEntry,
  fetchAnalyticsResourceMetrics,
  fetchAnalyticsSearches,
  fetchAnalyticsSessions,
  fetchAnalyticsStats,
  fetchAnalyticsZeroResultQueries,
} from './analyticsCache';
import { DateRange } from './types';

export type { AnalyticsMetricsWithTrend } from './analyticsCache';
export type AsyncData<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  refetch: () => void;
};

function toTenantId(
  selectedTenantID: string | number | null | undefined,
): string | undefined {
  return selectedTenantID ? String(selectedTenantID) : undefined;
}

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
    tenantId: toTenantId(selectedTenantID),
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

      // Keep the last-known data visible while revalidating (SWR).
      setState((prev) => ({ loading: true, error: null, data: prev.data }));
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

export const useAnalyticsStats = makeAsyncHook<StatsResponse>(fetchAnalyticsStats);
export const useAnalyticsMetrics =
  makeAsyncHook<AnalyticsMetricsWithTrend>(fetchAnalyticsMetrics);
export const useAnalyticsPageviews =
  makeAsyncHook<PageviewsResponse[]>(fetchAnalyticsPageviews);
export const useAnalyticsResourceMetrics =
  makeAsyncHook<ResourceMetricsResponse[]>(fetchAnalyticsResourceMetrics);
export const useAnalyticsSearches =
  makeAsyncHook<SearchesResponse>(fetchAnalyticsSearches);
export const useAnalyticsZeroResultQueries =
  makeAsyncHook<ZeroResultQueriesResponse[]>(fetchAnalyticsZeroResultQueries);
export const useAnalyticsLanguageSwitches =
  makeAsyncHook<LanguageSwitchesResponse[]>(fetchAnalyticsLanguageSwitches);
export const useAnalyticsResourceByEntry =
  makeAsyncHook<ResourceByEntryResponse[]>(fetchAnalyticsResourceByEntry);
export const useAnalyticsSessions =
  makeAsyncHook<PaginatedSessionsResponse>(fetchAnalyticsSessions);
export const useAnalyticsHeatmap =
  makeAsyncHook<HeatmapPointResponse[]>(fetchAnalyticsHeatmap);
export const useAnalyticsAreaSearches =
  makeAsyncHook<AreaSearchesResponse>(fetchAnalyticsAreaSearches);

export function useAnalyticsInfo(
  tenantId: string | undefined,
): AsyncData<AnalyticsInfoResponse> {
  const [state, setState] = useState<
    Omit<AsyncData<AnalyticsInfoResponse>, 'refetch'>
  >({
    loading: true,
    error: null,
    data: null,
  });

  const requestIdRef = useRef(0);

  const load = useCallback(
    (force: boolean) => {
      const requestId = ++requestIdRef.current;

      if (!tenantId) {
        setState({ loading: false, error: null, data: null });
        return;
      }

      setState((prev) => ({ loading: true, error: null, data: prev.data }));
      fetchAnalyticsInfo(tenantId, force)
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
    },
    [tenantId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return { ...state, refetch: () => load(true) };
}

export function useAnalyticsEventCatalog(
  tenantId: string | undefined,
): AsyncData<EventCatalogEntryResponse[]> {
  const [state, setState] = useState<
    Omit<AsyncData<EventCatalogEntryResponse[]>, 'refetch'>
  >({
    loading: true,
    error: null,
    data: null,
  });

  const requestIdRef = useRef(0);

  const load = useCallback(
    (force: boolean) => {
      const requestId = ++requestIdRef.current;

      if (!tenantId) {
        setState({ loading: false, error: null, data: null });
        return;
      }

      setState((prev) => ({ loading: true, error: null, data: prev.data }));
      fetchAnalyticsEventCatalog(tenantId, force)
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
    },
    [tenantId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return { ...state, refetch: () => load(true) };
}

export function useAnalyticsEventValues(
  event: string,
  property: string,
): AsyncData<EventValuesResponse[]> {
  const { range, tenantId, websiteIds } = useAnalyticsParams();
  const [state, setState] = useState<
    Omit<AsyncData<EventValuesResponse[]>, 'refetch'>
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
    property,
  });
  paramsRef.current = { range, tenantId, websiteIds, event, property };

  const requestIdRef = useRef(0);

  const load = useCallback((force: boolean) => {
    const requestId = ++requestIdRef.current;
    const {
      range: currentRange,
      tenantId: currentTenantId,
      websiteIds: currentWebsiteIds,
      event: currentEvent,
      property: currentProperty,
    } = paramsRef.current;

    if (!currentTenantId || !currentEvent || !currentProperty) {
      setState({ loading: false, error: null, data: null });
      return;
    }

    setState((prev) => ({ loading: true, error: null, data: prev.data }));
    fetchAnalyticsEventValues(
      currentRange,
      currentTenantId,
      currentWebsiteIds,
      { event: currentEvent, property: currentProperty },
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
  }, [range, tenantId, websiteIds, event, property, load]);

  return {
    ...state,
    refetch: () => load(true),
  };
}
