import axios from 'axios';
import { API_URL, TENANT_ID } from '../lib/constants';

export class ShortUrlService {
  static endpoint = 'short-url';

  static async getShortUrl(url: string) {
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
}
