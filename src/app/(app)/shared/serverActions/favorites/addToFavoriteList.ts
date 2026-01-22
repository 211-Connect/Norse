'use server';

import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';

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
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  return fetchWrapper(url, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-api-version': '1',
    },
    body: {
      resourceId: resourceId,
      favoriteListId: favoriteListId,
    },
    cache: 'no-store',
  });
};
