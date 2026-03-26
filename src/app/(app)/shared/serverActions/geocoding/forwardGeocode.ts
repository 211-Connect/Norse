'use server';

import { GeocodeResult } from '@/types/resource';
import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

type GeocodingModule = 'mapbox' | 'opencage';

export async function forwardGeocode(
  address: string,
  options: { locale: string; tenantId?: string; module?: GeocodingModule },
): Promise<GeocodeResult[]> {
  const searchParams = new URLSearchParams({
    address: address,
    locale: options.locale,
    limit: '5',
  });

  if (!options.module) {
    searchParams.append('module', 'mapbox');
  }

  if (options.tenantId) {
    searchParams.append('tenant_id', options.tenantId);
  }

  const data = await fetchWrapper(
    `${API_URL}/geocoding/forward?${searchParams.toString()}`,
    {
      headers: {
        'x-api-version': '1',
        'x-api-key': INTERNAL_API_KEY || '',
        ...(options.tenantId && { 'x-tenant-id': options.tenantId }),
      },
    },
  );

  // The API proxy already returns the data in the expected format
  return data || [];
}
