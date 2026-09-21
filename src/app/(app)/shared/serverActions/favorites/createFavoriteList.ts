'use server';

import { CreateFavoriteListDto, FavoriteListItemDto } from '@/types/favorites';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export const createFavoriteList = async (
  data: CreateFavoriteListDto,
  tenantId: string,
): Promise<FavoriteListItemDto | null> => {
  const headers = await getApiHeaders(tenantId);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetchWrapper<FavoriteListItemDto>(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'x-api-version': '1',
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
