'use server';

import { CreateFavoriteListDto, FavoriteListItemDto } from '@/types/favorites';

import { getAuthHeaders } from '../../lib/authHeaders';
import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

export const createFavoriteList = async (
  data: CreateFavoriteListDto,
  tenantId?: string,
): Promise<FavoriteListItemDto | null> => {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetchWrapper<FavoriteListItemDto>(url, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    body: {
      name: data.name,
      description: data.description,
      public: data.public,
    },
    cache: 'no-store',
  });

  if (!response) {
    return null;
  }

  return response;
};
