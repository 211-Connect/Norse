'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export const updateFavoriteList = async (
  {
    id,
    name,
    description,
    privacy,
  }: {
    id: string;
    name: string;
    description?: string;
    privacy: boolean;
  },
  tenantId?: string,
) => {
  try {
    const { data } = await createAxiosWithAuth({ tenantId }).put(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}`,
      {
        name,
        description,
        public: privacy,
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
