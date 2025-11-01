'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
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
    const { data } = await createAxiosWithAuth({ tenantId }).post(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}`,
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
    console.log(err);
    return null;
  }
};
