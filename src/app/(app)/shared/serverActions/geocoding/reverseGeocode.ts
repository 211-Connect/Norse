'use server';

import { geocodingApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';
import { GeocodingControllerReverseGeocodeData } from '@/lib/api/generated/data-contracts';
import { GeocodeResult } from '@/types/resource';
import {
  CacheKey,
  ONE_MONTH,
  stableHash,
  withCache,
} from '@/utilities/withCache';

type GeocodingProvider = 'mapbox' | 'opencage';

export async function reverseGeocode(
  coords: string,
  options: { locale: string; tenantId: string; provider?: GeocodingProvider },
): Promise<GeocodeResult[]> {
  const { locale, tenantId, provider } = options;

  const hash = stableHash({
    coords,
    locale,
    provider: provider ?? 'mapbox',
  });
  const cacheKey: CacheKey = `reverse_geocode:${hash}`;

  const data = await withCache(
    cacheKey,
    async () => {
      const response = await geocodingApiClient.request<
        GeocodingControllerReverseGeocodeData,
        void
      >({
        path: '/geocoding/reverse',
        method: 'GET',
        query: {
          coordinates: coords,
          ...(provider ? { provider } : {}),
        },
        format: 'json',
        headers: {
          'accept-language': locale,
          'x-tenant-id': tenantId,
          ...(await getTenantApiKeyHeaders(tenantId)),
        },
        cache: 'no-store',
      });

      return response.data || [];
    },
    { redis: true, memory: false, ttl: ONE_MONTH },
  );

  return data || [];
}
