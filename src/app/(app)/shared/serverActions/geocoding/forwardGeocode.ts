'use server';

import { geocodingApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { GeocodingControllerForwardGeocodeParams } from '@/lib/api/generated/data-contracts';
import { GeocodeResult } from '@/types/resource';

type GeocodingProvider = 'mapbox' | 'opencage';

export async function forwardGeocode(
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
      headers: {
        'accept-language': locale,
        'x-tenant-id': tenantId,
        ...(await getTenantApiKeyHeaders(tenantId)),
      },
      cache: 'no-store',
    },
  );

  return response.data || [];
}
