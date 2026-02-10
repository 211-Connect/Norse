'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';

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
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    body: {
      name,
      description,
      public: privacy,
    },
    cache: 'no-store',
  });
};
