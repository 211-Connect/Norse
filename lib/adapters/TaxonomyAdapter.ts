import { BaseAdapter } from './BaseAdapter';
import qs from 'qs';

export class TaxonomyAdapter extends BaseAdapter {
  public async getTaxonomySuggestions(query: string) {
    const { data } = await this.axios.get(
      `/taxonomy?${qs.stringify({
        query,
      })}`
    );

    return data.hits.hits.map((hit: any) => ({
      id: hit._id,
      value: hit._source.name,
      term: hit._source.code,
      group: this.t ? this.t('search.taxonomies') : 'Taxonomies',
      group_label: 'Taxonomies',
    }));
  }

  public async getTaxonomySuggestionsByCode(code: string) {
    const { data } = await this.axios.get(
      `/taxonomy?${qs.stringify({
        code,
      })}`
    );

    return data.hits.hits.map((hit: any) => ({
      id: hit._id,
      value: hit._source.name,
      term: hit._source.code,
      group: this.t ? this.t('search.taxonomies') : 'Taxonomies',
      group_label: 'Taxonomies',
    }));
  }
}
