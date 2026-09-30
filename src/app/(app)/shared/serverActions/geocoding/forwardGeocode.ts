'use server';

import { geocodingApiClient, getApiHeaders } from '@/lib/api';
import { GeocodingControllerForwardGeocodeParams } from '@/lib/api/generated/data-contracts';
import { GeocodeResult } from '@/types/resource';
import { ONE_DAY, stableHash, withCache } from '@/utilities/withCache';

const GEOCODE_CACHE_TTL = 7 * ONE_DAY;

type GeocodingProvider = 'mapbox' | 'opencage';

async function forwardGeocodeOrigin(
  address: string,
  options: { locale: string; tenantId: string; provider?: GeocodingProvider },
): Promise<GeocodeResult[]> {
  const { locale, tenantId, provider } = options;

  const query: GeocodingControllerForwardGeocodeParams = {
    address,
    limit: 5,
    ...(provider ? { provider } : {}),
  };

  const response = await geocodingApiClient.geocodingControllerForwardGeocode(
    query,
    {
      headers: await getApiHeaders(tenantId, locale),
      cache: 'no-store',
    },
  );

  return response.data || [];
}

export async function forwardGeocode(
  address: string,
  options: { locale: string; tenantId: string; provider?: GeocodingProvider },
): Promise<GeocodeResult[]> {
  const { locale, tenantId, provider } = options;
  const normalizedAddress = address.trim().toLowerCase();

  return (
    (await withCache(
      `forward_geocode:${stableHash({
        address: normalizedAddress,
        locale,
        provider,
        tenantId,
      })}`,
      () => forwardGeocodeOrigin(address, options),
      { redis: true, memory: false, ttl: GEOCODE_CACHE_TTL },
    )) ?? []
  );
}
