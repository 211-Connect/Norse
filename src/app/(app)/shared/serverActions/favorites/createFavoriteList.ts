'use server';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';

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
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchWrapper(url, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-api-version': '1',
    },
    body: {
      name,
      description,
      public: privacy,
    },
    cache: 'no-store',
  });
};
