import axios from 'axios';

export const isTaxonomyCode = new RegExp(
  /^[a-zA-Z]{1,2}(-\d{1,4}(\.\d{1,4}){0,3})?$/i,
);

export type Taxonomy = {};

export default function TaxonomyAdapter() {
  return {
    searchTaxonomies: async (query, locale) => {
      const apiQuery: { locale: string; query?: string; code?: string } = {
        locale,
      };

      if (isTaxonomyCode.test(query)) {
        apiQuery.code = query;
      } else {
        apiQuery.query = query;
      }

      const res = await axios.get('/api/taxonomy', {
        params: apiQuery,
      });

      return res.data;
    },
  };
}
