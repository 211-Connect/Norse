import { API_URL } from '../lib/constants';
import { Axios } from '../lib/axios';
import { AxiosError } from 'axios';

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

  static async getTaxonomies(searchTerm: string, options: { locale: string }) {
    const res = await Axios.get(`${API_URL}/${this.endpoint}`, {
      params: {
        locale: options.locale,
        query: searchTerm,
      },
      headers: {
        'accept-language': options.locale,
        'x-api-version': '1',
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

  static async getTaxonomyTerms(
    terms: string[],
    options: { locale: string },
  ): Promise<TaxonomyTerm[]> {
    const url = `${API_URL}/${this.endpoint}/term`;
    const headers = {
      'accept-language': options.locale,
      'x-api-version': '1',
    };

    try {
      const response = await Axios.get(url, {
        params: {
          locale: options.locale,
          terms: terms,
        },
        headers,
      });

      if (!response.data || !response.data.hits?.hits) {
        console.warn(
          'API response missing expected data structure:',
          response.data,
        );
        return [];
      }

      return response.data.hits.hits.map((hit: any) => ({
        id: hit._id,
        code: hit._source.code,
        name: hit._source.name,
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          `Error fetching taxonomy terms from ${url}`,
          error.message,
        );
      } else {
        console.error(
          `An unexpected error occurred while fetching taxonomy terms from ${url}`,
          error,
        );
      }
      return []; // Return an empty array on error
    }
  }
}
