'use server';

import { FavoriteListItemDto, UpdateFavoriteListDto } from '@/types/favorites';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export const updateFavoriteList = async (
  id: string,
  data: UpdateFavoriteListDto,
  tenantId: string,
): Promise<FavoriteListItemDto | null> => {
  const headers = await getApiHeaders(tenantId);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetchWrapper<FavoriteListItemDto & { _id?: string }>(
    url,
    {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
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
