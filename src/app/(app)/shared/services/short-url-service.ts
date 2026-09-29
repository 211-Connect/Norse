import { shortUrlApiClient } from '@/lib/api/clients';

import { getApiHeaders } from '../lib/get-api-headers';

export class ShortUrlService {
  static async expandUrl(id: string, tenantId: string): Promise<string | null> {
    const response = await shortUrlApiClient.shortUrlControllerGetShortUrlById(
      { id },
      { headers: await getApiHeaders(tenantId) },
    );

    return response.data?.url ?? null;
  }

  static async shortenUrl(
    url: string,
    tenantId: string,
  ): Promise<string | null> {
    const response =
      await shortUrlApiClient.shortUrlControllerGetOrCreateShortUrl(
        { url },
        { headers: await getApiHeaders(tenantId), cache: 'no-store' },
      );

    const shortUrl = response.data?.url;
    if (!shortUrl) {
      return null;
    }

    // Backend shouldn't return frontend URLs really,
    // keep it straightforward and backwards compatible
    // by extracting the ID from the short URL.
    return shortUrl.split('/').pop() ?? null;
  }
}
