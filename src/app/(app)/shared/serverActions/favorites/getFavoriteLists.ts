'use server';

import { cache } from 'react';
import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const getFavoriteLists = cache(async (tenantId?: string) => {
  try {
    const { data } = await fetchApiWithAuth(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}`,
      {
        tenantId,
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    console.error('Error fetching favorite lists:', err);
    return [];
  }
});
