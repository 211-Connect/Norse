'use server';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

export async function reverseGeocode(
  coords: string,
  options: { locale: string; tenantId?: string },
): Promise<
  {
    address: string;
    coordinates: [number, number];
    country?: string;
    district?: string;
    place?: string;
    postcode?: string;
    region?: string;
  }[]
> {
  const searchParams = new URLSearchParams({
    coordinates: coords,
    locale: options.locale,
  });

  if (options.tenantId) {
    searchParams.append('tenant_id', options.tenantId);
  }

  const data = await fetchWrapper(
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
  return data || [];
}
