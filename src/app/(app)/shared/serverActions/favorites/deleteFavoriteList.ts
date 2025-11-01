'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const deleteFavoriteList = async (id: string, tenantId?: string) => {
  try {
    const { data } = await createAxiosWithAuth({ tenantId }).delete(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}`,
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
