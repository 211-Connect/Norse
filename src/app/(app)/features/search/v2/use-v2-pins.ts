'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import {
  pinsCallString,
  usablePins,
  type V2Pin,
  type V2PinsResponse,
} from './v2-pins';

/**
 * The map's pins from `GET /v2/search/pins`, for the same page URL as the list. The call carries the
 * list's result-changing parameters, so the map and the list show the same set. A failed call
 * returns no pins; the map then falls back to the list's current page.
 */
export function useV2Pins(): { pins: V2Pin[] | undefined; truncated: boolean } {
  const params = useSearchParams()!;
  const { tenantId } = useAppConfig();
  const callString = useMemo(() => pinsCallString(params), [params]);
  const query = (params.get('query_label') ?? params.get('query') ?? '').trim();

  const { data } = useQuery({
    queryKey: ['v2-pins', tenantId, callString],
    enabled: Boolean(query && tenantId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }): Promise<V2PinsResponse> => {
      const res = await fetch(
        `/api/v2-search/pins?tenant_id=${encodeURIComponent(tenantId ?? '')}&${callString}`,
        { signal },
      );
      if (!res.ok) throw new Error(`v2 pins ${res.status}`);
      return (await res.json()) as V2PinsResponse;
    },
  });
  return {
    pins: data ? usablePins(data) : undefined,
    truncated: Boolean(data?.truncated),
  };
}
