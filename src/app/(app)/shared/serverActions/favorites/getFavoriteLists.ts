'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';
import {
  FavoriteListResponseDto,
  GetFavoriteListsResponse,
  Privacy,
} from '@/types/favorites';

export async function getFavoriteLists(
  tenantId?: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  locale: string = 'en',
): Promise<GetFavoriteListsResponse> {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }
  searchParams.append('page', page.toString());
  searchParams.append('limit', limit.toString());
  if (search) {
    searchParams.append('search', search);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetchWrapper<FavoriteListResponseDto>(url, {
    headers: {
      ...authHeaders,
      'accept-language': locale,
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    cache: 'no-store',
  })

  const items = response?.items || [];
  const totalCount = response?.total || 0;

  const data = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    privacy: item.privacy as Privacy,
    ownerId: item.ownerId,
  }));

  return { data, totalCount };
}
