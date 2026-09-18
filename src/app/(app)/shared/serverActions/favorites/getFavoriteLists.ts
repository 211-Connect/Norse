'use server';

import {
  FavoriteListResponseDto,
  GetFavoriteListsResponse,
  Privacy,
} from '@/types/favorites';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export async function getFavoriteLists(
  tenantId: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  locale: string = 'en',
  resourceId?: string,
): Promise<GetFavoriteListsResponse> {
  const headers = await getApiHeaders(tenantId);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);
  searchParams.append('page', page.toString());
  searchParams.append('limit', limit.toString());
  if (search) {
    searchParams.append('search', search);
  }
  if (resourceId) {
    searchParams.append('resource_id', resourceId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetchWrapper<FavoriteListResponseDto>(url, {
    headers: {
      ...headers,
      'accept-language': locale,
    },
    cache: 'no-store',
  });

  const items = response?.items || [];
  const totalCount = response?.total || 0;

  const data = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    privacy: item.privacy as Privacy,
    ownerId: item.ownerId,
    containsResource: item.containsResource,
  }));

  return { data, totalCount };
}
