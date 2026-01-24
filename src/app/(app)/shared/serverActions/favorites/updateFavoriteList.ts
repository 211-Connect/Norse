'use server';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { FetchError } from '../../lib/fetchError';

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
    const authHeaders = await getAuthHeaders(tenantId);

    const searchParams = new URLSearchParams();
    if (tenantId) {
      searchParams.append('tenant_id', tenantId);
    }

    const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'x-api-version': '1',
      },
      body: JSON.stringify({
        name,
        description,
        public: privacy,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
};
