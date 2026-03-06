'use server';

import {
  API_URL,
  FAVORITES_BASE_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper, sanitizePathSegment } from '../../lib/fetchWrapper';

export const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId?: string,
): Promise<any> => {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const safeResourceId = sanitizePathSegment(resourceId);
  const safeFavoriteListId = sanitizePathSegment(favoriteListId);
  const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}/${safeResourceId}/${safeFavoriteListId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchWrapper<void>(url, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    cache: 'no-store',
  });
};
