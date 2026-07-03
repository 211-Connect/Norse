'use server';

import { geocodingApiClient } from '@/lib/api/clients';
import { GeocodingControllerForwardGeocodeParams } from '@/lib/api/generated/data-contracts';
import { GeocodeResult } from '@/types/resource';

import { INTERNAL_API_KEY } from '../../lib/constants';

type GeocodingProvider = 'mapbox' | 'opencage';

export async function forwardGeocode(
  address: string,
  options: { locale: string; tenantId?: string; provider?: GeocodingProvider },
): Promise<GeocodeResult[]> {
  const query: GeocodingControllerForwardGeocodeParams = {
    address,
    limit: 5,
    ...(options.provider ? { provider: options.provider } : {}),
  };

  const response = await geocodingApiClient.geocodingControllerForwardGeocode(
    query,
    {
      headers: {
        'accept-language': options.locale,
        ...(options.tenantId ? { 'x-tenant-id': options.tenantId } : {}),
      },
      cache: 'no-store',
    },
  );

  return response.data || [];
}
