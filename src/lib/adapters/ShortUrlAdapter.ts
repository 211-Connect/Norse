import { BaseAdapter } from './BaseAdapter';

export class ShortUrlAdapter extends BaseAdapter {
  public async createShortUrl(url: string): Promise<{ url: string }> {
    const { data } = await this.axios.post(`/short-url`, {
      url,
    });

    return data;
  }
}
