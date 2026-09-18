'use server';

import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId: string,
): Promise<any> => {
  const headers = await getApiHeaders(tenantId);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}/${resourceId}/${favoriteListId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchWrapper<void>(url, {
    method: 'DELETE',
    headers: {
      ...headers,
    },
    cache: 'no-store',
  });
};
