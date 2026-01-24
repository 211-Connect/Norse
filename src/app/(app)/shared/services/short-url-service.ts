import { API_URL } from '../lib/constants';
import { FetchError } from '../lib/fetchError';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async expandUrl(
    id: string,
    tenantId?: string,
  ): Promise<string | null> {
    const response = await fetch(`${API_URL}/${this.endpoint}/${id}`, {
      headers: {
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
    }

    const data = await response.json();
    return data?.url || null;
  }

  static async shortenUrl(
    url: string,
    tenantId?: string,
  ): Promise<string | null> {
    const response = await fetch(`${API_URL}/${this.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '1',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
      body: JSON.stringify({ url }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
    }

    const data = await response.json();
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
