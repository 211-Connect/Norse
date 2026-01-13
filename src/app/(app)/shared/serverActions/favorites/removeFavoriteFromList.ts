'use server';

import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';

export const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId?: string,
) => {
  try {
    const { data } = await fetchApiWithAuth(
      `${API_URL}/${FAVORITES_BASE_ENDPOINT}/${resourceId}/${favoriteListId}`,
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
