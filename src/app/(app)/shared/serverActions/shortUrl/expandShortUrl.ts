'use server';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

export async function expandShortUrl(
  id: string,
  tenantId?: string,
): Promise<string | null> {
  const data = await fetchWrapper(`${API_URL}/short-url/${id}`, {
    headers: {
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
      ...(tenantId && { 'x-tenant-id': tenantId }),
    },
    cache: 'no-store',
  });

  if (!data) {
    return null;
  }
  return data.url;
}
