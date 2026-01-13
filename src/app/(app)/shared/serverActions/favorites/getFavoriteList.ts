'use server';

import { cache } from 'react';
import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const getFavoriteList = cache(
  async (id: string, locale: string, tenantId?: string) => {
    try {
      const { data } = await fetchApiWithAuth(
        `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}`,
        {
          tenantId,
          params: {
            locale,
          },
          headers: {
            'accept-language': locale,
            'x-api-version': '1',
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
