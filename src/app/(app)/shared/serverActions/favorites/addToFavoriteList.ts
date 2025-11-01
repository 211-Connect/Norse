'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
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
    const { data } = await createAxiosWithAuth({ tenantId }).post(
      `${API_URL}/${FAVORITES_BASE_ENDPOINT}`,
      {
        resourceId: resourceId,
        favoriteListId: favoriteListId,
      },
      {
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
