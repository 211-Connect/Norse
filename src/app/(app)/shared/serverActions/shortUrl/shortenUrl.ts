'use server';

import { getApiHeaders } from '@/lib/api';
import { shortUrlApiClient } from '@/lib/api/clients';

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
