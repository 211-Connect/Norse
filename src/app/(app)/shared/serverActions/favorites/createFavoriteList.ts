'use server';

import { fetchApiWithAuth } from '../../lib/fetchWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const createFavoriteList = async (
  {
    name,
    description,
    privacy,
  }: {
    name: string;
    description?: string;
    privacy: boolean;
  },
  tenantId?: string,
) => {
  try {
    const { data } = await fetchApiWithAuth(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}`,
      {
        tenantId,
        method: 'POST',
        body: {
          name,
          description,
          public: privacy,
        },
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
};
