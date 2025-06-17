import { API_URL } from '../lib/constants';
import { Axios } from '../lib/axios';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async expandUrl(id: string): Promise<string | null> {
    const res = await Axios.get(`${API_URL}/${this.endpoint}/${id}`, {
      headers: {
        'x-api-version': '1',
      },
    });

    return res.data?.url || null;
  }

  static async shortenUrl(url: string): Promise<string | null> {
    const res = await Axios.post(
      `${API_URL}/${this.endpoint}`,
      {
        url,
      },
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    const shortUrl = res.data?.url;
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
