'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
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
    const { data } = await createAxiosWithAuth({ tenantId }).delete(
      `${API_URL}/${FAVORITES_BASE_ENDPOINT}/${resourceId}/${favoriteListId}`,
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
