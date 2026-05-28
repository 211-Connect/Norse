'use server';

import { GeocodeResult } from '@/types/resource';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

type GeocodingProvider = 'mapbox' | 'opencage';

export interface ForwardGeocodeBatchItem {
  address: string;
  results: GeocodeResult[];
  error?: never;
}

export interface ForwardGeocodeBatchErrorItem {
  address: string;
  error: string;
  results?: never;
}

export type ForwardGeocodeBatchResult =
  | ForwardGeocodeBatchItem
  | ForwardGeocodeBatchErrorItem;

/**
 * Batch forward geocode up to 50 addresses per call.
 * The API always returns 200 — individual failures are represented as items
 * with an `error` field rather than `results`.
 */
export async function forwardGeocodeBatch(
  addresses: string[],
  options: { locale?: string; tenantId?: string; provider?: GeocodingProvider },
): Promise<ForwardGeocodeBatchResult[]> {
  const data = await fetchWrapper<ForwardGeocodeBatchResult[]>(
    `${API_URL}/geocoding/forward/batch`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '1',
        'x-api-key': INTERNAL_API_KEY || '',
        ...(options.tenantId && { 'x-tenant-id': options.tenantId }),
      },
      body: {
        addresses,
        provider: options.provider ?? 'mapbox',
        locale: options.locale ?? 'en',
      },
    },
  );

  return data ?? [];
}
