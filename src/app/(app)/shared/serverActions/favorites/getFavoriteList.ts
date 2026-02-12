'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { FavoriteListItemDto } from '@/types/favorites';

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId?: string,
): Promise<FavoriteListItemDto | null> {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams({ locale });
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}?${searchParams.toString()}`;
  const response = await fetchWrapper<FavoriteListItemDto>(
    url,
    {
      headers: {
        ...authHeaders,
        'accept-language': locale,
        'x-api-version': '1',
        'x-api-key': INTERNAL_API_KEY || '',
      },
      cache: 'no-store',
    },
  );

  if (!response) {
    return null;
  }

  return response;
}
