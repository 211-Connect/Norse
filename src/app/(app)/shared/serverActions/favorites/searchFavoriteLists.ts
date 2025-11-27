'use server';

import { cache } from 'react';
import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const searchFavoriteLists = cache(
  async (searchText: string, tenantId?: string) => {
    try {
      console.log(searchText, tenantId);
      console.log(createAxiosWithAuth({ tenantId }));
      const { data } = await createAxiosWithAuth({ tenantId }).get(
        `${API_URL}/${FAVORITES_LIST_ENDPOINT}/search`,
        {
          params: {
            name: searchText,
          },
          headers: {
            'x-api-version': '1',
          },
        },
      );

      return data;
    } catch (err) {
      console.error('Error searching favorite lists:', err);
      return [];
    }
  },
);
