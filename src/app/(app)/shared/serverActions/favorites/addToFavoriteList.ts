'use server';

import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';

export const addToFavoriteList = async (
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
      `${API_URL}/${FAVORITES_BASE_ENDPOINT}`,
      {
        tenantId,
        method: 'POST',
        body: {
          resourceId: resourceId,
          favoriteListId: favoriteListId,
        },
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
