'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { UpdateFavoriteListDto, FavoriteListItemDto } from '@/types/favorites';

export const updateFavoriteList = async (
  id: string,
  data: UpdateFavoriteListDto,
  tenantId?: string,
): Promise<FavoriteListItemDto | null> => {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetchWrapper<FavoriteListItemDto & { _id?: string }>(
    url,
    {
      method: 'PUT',
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
    },
  );

  if (!response) {
    return null;
  }

  return {
    ...response,
    id: response.id || response._id,
  } as FavoriteListItemDto;
};
