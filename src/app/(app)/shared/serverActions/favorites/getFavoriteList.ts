'use server';

import { cache } from 'react';
import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const getFavoriteList = cache(
  async (id: string, locale: string, tenantId?: string) => {
    try {
      const { data } = await createAxiosWithAuth({ tenantId }).get(
        `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}`,
        {
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
          },
          params: {
            locale,
          },
        },
      );

      return data;
    } catch (err) {
      console.log(err);
      return {};
    }
  },
);
