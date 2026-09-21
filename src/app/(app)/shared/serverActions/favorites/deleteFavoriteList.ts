'use server';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export const deleteFavoriteList = async (
  id: string,
  tenantId: string,
): Promise<void | null> => {
  const headers = await getApiHeaders(tenantId);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchWrapper<void>(url, {
    method: 'DELETE',
    headers: {
      ...headers,
    },
    cache: 'no-store',
  });
};
