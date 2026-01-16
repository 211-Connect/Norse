'use server';

import { createAxiosWithAuth } from '../../lib/axiosWithAuth';
import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';

export async function getFavoriteLists(tenantId?: string) {
  try {
    const { data } = await createAxiosWithAuth({ tenantId }).get(
      `${API_URL}/${FAVORITES_LIST_ENDPOINT}`,
      {
        headers: {
          'x-api-version': '1',
        },
      },
    );

    return data;
  } catch (err) {
    console.error('Error fetching favorite lists:', err);
    return [];
  }
}
