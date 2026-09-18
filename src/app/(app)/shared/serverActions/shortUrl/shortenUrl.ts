'use server';

import { shortUrlApiClient } from '@/lib/api/clients';

import { getApiHeaders } from '../../lib/get-api-headers';

export async function shortenUrl(
  url: string,
  tenantId: string,
): Promise<string | null> {
  const response =
    await shortUrlApiClient.shortUrlControllerGetOrCreateShortUrl(
      { url },
      { headers: await getApiHeaders(tenantId) },
    );

  const shortUrl = response.data?.url;
  if (!shortUrl) {
    return null;
  }

  // Backend shouldn't return frontend URLs really,
  // keep it straightforward and backwards compatible
  // by extracting the ID from the short URL.
  const id = shortUrl.split('/').pop();

  return id ?? null;
}
