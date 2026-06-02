'use server';

import { GeocodeResult } from '@/types/resource';
import { stableHash, withCache } from '@/utilities/withCache';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

type GeocodingProvider = 'mapbox' | 'opencage';

export async function reverseGeocode(
  coords: string,
  options: { locale: string; tenantId?: string; provider?: GeocodingProvider },
): Promise<GeocodeResult[]> {
  const hash = stableHash({
    coords,
    locale: options.locale,
    provider: options.provider ?? 'mapbox',
  });
  const cacheKey = `reverse_geocode:${hash}` as const;

  const data = await withCache(
    cacheKey,
    async () => {
      const searchParams = new URLSearchParams({
        coordinates: coords,
        locale: options.locale,
      });

      if (options.provider) {
        searchParams.append('provider', options.provider);
      }

      if (options.tenantId) {
        searchParams.append('tenant_id', options.tenantId);
      }

      const response = await fetchWrapper<GeocodeResult[]>(
        `${API_URL}/geocoding/reverse?${searchParams.toString()}`,
        {
          headers: {
            'x-api-version': '1',
            'x-api-key': INTERNAL_API_KEY || '',
            ...(options.tenantId && { 'x-tenant-id': options.tenantId }),
          },
        },
      );

      // The API proxy already returns the data in the expected format
      return response || [];
    },
    { redis: true, memory: false },
  );

  return data || [];
}
