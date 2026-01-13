'use server';

import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const deleteFavoriteList = async (id: string, tenantId?: string) => {
  try {
    const { data } = await fetchApiWithAuth(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}`,
      {
        tenantId,
        method: 'DELETE',
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    return null;
  }
};
