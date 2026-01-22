import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async expandUrl(
    id: string,
    tenantId?: string,
  ): Promise<string | null> {
    const data = await fetchWrapper(`${API_URL}/${this.endpoint}/${id}`, {
      headers: {
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      cache: 'no-store',
    });

    if (!data) {
      return null;
    }
    return data.url;
  }

  static async shortenUrl(
    url: string,
    tenantId?: string,
  ): Promise<string | null> {
    const data = await fetchWrapper(`${API_URL}/${this.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '1',
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
}
