'use server';

import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { FetchError } from '../../lib/fetchError';

export const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId?: string,
) => {
  try {
    const authHeaders = await getAuthHeaders(tenantId);

    const searchParams = new URLSearchParams();
    if (tenantId) {
      searchParams.append('tenant_id', tenantId);
    }

    const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}/${resourceId}/${favoriteListId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
        'x-api-version': '1',
      },
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

    const data = await response.json().catch(() => null);
    return data;
  } catch (err) {
    return null;
  }
};
