import { API_URL } from '../lib/constants';
import { Axios } from '../lib/axios';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async getShortUrlById(id: string) {
    const res = await Axios.get(`${API_URL}/${this.endpoint}/${id}`, {
      headers: {
        'x-api-version': '1',
      },
    });

    return res.data;
  }

  static async getOrCreateShortUrl(url: string) {
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

    return res.data;
  }

  static async createShortUrl(url: string): Promise<{ url: string }> {
    const { data } = await Axios.post(
      `/${this.endpoint}`,
      {
        url,
      },
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  }
}
