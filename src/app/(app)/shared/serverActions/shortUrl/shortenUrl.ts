'use server';

import { API_URL, INTERNAL_API_KEY } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

export async function shortenUrl(
  url: string,
  tenantId?: string,
): Promise<string | null> {
  const data = await fetchWrapper(`${API_URL}/short-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
      ...(tenantId && { 'x-tenant-id': tenantId }),
    },
    body: { url },
    cache: 'no-store',
  });

  const shortUrl = data?.url;
  if (!shortUrl) {
    return null;
  }

  // Backend shouldn't return frontend URLs really,
  // keep it straightforward and backwards compatible
  // by extracting the ID from the short URL.
  const id = shortUrl.split('/').pop();

  return id;
}
