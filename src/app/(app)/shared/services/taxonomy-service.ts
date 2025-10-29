import { API_URL } from '../lib/constants';
import { createAxios } from '../lib/axios';

interface TaxonomyTerm {
  id: string;
  code: string;
  name: string;
}

export class TaxonomyService {
  static endpoint = 'taxonomy';

  static taxonomyCodeRegexp = new RegExp(
    /^[a-zA-Z]{1,2}(-\d{1,4}(\.\d{1,4}){0,3})?$/i,
  );

  static isTaxonomyCode(code: string) {
    return this.taxonomyCodeRegexp.test(code);
  }

  static async getTaxonomies(
    searchTerm: string,
    options: { locale: string; tenantId?: string },
  ) {
    const res = await createAxios(options.tenantId).get(
      `${API_URL}/${this.endpoint}`,
      {
        params: {
          locale: options.locale,
          query: searchTerm,
        },
        headers: {
          'accept-language': options.locale,
          'x-api-version': '1',
        },
      },
    );

    return (
      res.data?.hits?.hits?.map((hit) => ({
        id: hit?._id,
        code: hit?._source?.code,
        name: hit?._source?.name,
      })) ?? []
    );
  }
}
