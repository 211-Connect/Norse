import { BaseAdapter } from './BaseAdapter';
import qs from 'qs';

export class TaxonomyAdapter extends BaseAdapter {
  public async getTaxonomySuggestions(
    query: string,
    config?: { locale?: string }
  ) {
    if (!this.t) return null;

    const { data } = await this.axios.get(
      `/taxonomy?${qs.stringify({
        query,
      })}`,
      { ...(config?.locale ? { headers: { 'x-locale': config.locale } } : {}) }
    );

    return data.hits.hits.map((hit: any) => ({
      id: hit._id,
      value: hit._source.name,
      term: hit._source.code,
      group: this.t('search.taxonomies'),
      group_label: 'Taxonomies',
    }));
  }
}
