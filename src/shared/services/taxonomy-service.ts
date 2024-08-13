import axios from 'axios';
import { API_URL, TENANT_ID } from '../lib/constants';

export class TaxonomyService {
  static endpoint = 'taxonomy';

  static async getTaxonomies(searchTerm: string, options: { locale: string }) {
    const res = await axios.get(`${API_URL}/${this.endpoint}`, {
      params: {
        tenant_id: TENANT_ID,
        locale: options.locale,
        query: searchTerm,
      },
    });

    return (
      res.data?.hits?.hits?.map((hit) => ({
        id: hit?._id,
        code: hit?._source?.code,
        name: hit?._source?.name,
      })) ?? []
    );
  }
}
