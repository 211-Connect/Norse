import axios from 'axios';
import { API_URL, TENANT_ID } from '../lib/constants';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async getShortUrlById(id: string) {
    const res = await axios.get(`${API_URL}/${this.endpoint}/${id}`, {
      params: {
        tenant_id: TENANT_ID
      }
    });

    return res.data;
  }

  static async getOrCreateShortUrl(url: string) {
    const res = await axios.post(
      `${API_URL}/${this.endpoint}`,
      {
        url,
      },
      {
        params: {
          tenant_id: TENANT_ID,
        },
      },
    );

    return res.data;
  }

  static async createShortUrl(url: string): Promise<{ url: string }> {
    const { data } = await axios.post(`/${this.endpoint}`, {
      url,
    }, {
      params: {
        tenant_id: TENANT_ID
      }
    });

    return data;
  }
}
