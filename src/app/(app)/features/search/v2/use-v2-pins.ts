'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { pinsCallEnabled, pinsCallString } from './v2-pins';

/**
 * The pins query of the v2 page URL, or null when the map asks no v2 pins: the tenant's switch
 * (`enableV2Api`) is off, there is no query, or `showAllResultsOnMap` is off. Feed it to
 * `useSearchPins(query, { v2: true })`: the one pins hook and the one `/api/search-pins` route
 * serve v1 and v2. The call carries the list's result-changing parameters, so the map and the list
 * show the same set.
 */
export function useV2PinsQuery(): string | null {
  const params = useSearchParams()!;
  const { tenantId, featureFlags, search } = useAppConfig();
  const { i18n } = useTranslation();
  const callString = useMemo(() => pinsCallString(params), [params]);
  const query = featureFlags.enableV2Api
    ? (params.get('query_label') ?? params.get('query') ?? '').trim()
    : '';
  if (
    !pinsCallEnabled({
      query,
      tenantId,
      showAllResultsOnMap: search.showAllResultsOnMap,
    })
  ) {
    return null;
  }
  return `${callString}&locale=${encodeURIComponent(i18n.language)}`;
}
