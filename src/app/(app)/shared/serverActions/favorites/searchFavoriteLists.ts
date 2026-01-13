'use server';

import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const searchFavoriteLists = async (
  searchText: string,
  tenantId?: string,
) => {
  try {
    const { data } = await fetchApiWithAuth(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}/search`,
      {
        tenantId,
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
};
