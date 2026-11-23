'use server';

import { geocodingApiClient, getApiHeaders } from '@/lib/api';
import { GeocodingControllerReverseGeocodeData } from '@/lib/api/generated/data-contracts';
import { createLogger } from '@/lib/logger';
import { GeocodeResult } from '@/types/resource';
import {
  CacheKey,
  ONE_DAY,
  stableHash,
  withCache,
} from '@/utilities/withCache';

const log = createLogger('reverseGeocode');

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

  try {
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
          headers: await getApiHeaders(tenantId, locale),
          cache: 'no-store',
        });

        return response.data || [];
      },
      { redis: true, memory: false, ttl: 7 * ONE_DAY },
    );
    return data || [];
  } catch (error) {
    // A geocoder failure must not break the page: continue without a place name.
    log.error({ err: error }, 'reverse geocode failed');
    return [];
  }
}
