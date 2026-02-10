'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';
import {
  FavoriteListV2Response,
  GetFavoriteListsResponse,
} from '@/types/favorites';

export async function getFavoriteLists(
  tenantId?: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
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
  const response = (await fetchWrapper(url, {
    headers: {
      ...authHeaders,
      'x-api-version': '2',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    cache: 'no-store',
  })) as FavoriteListV2Response;

  const hits = response?.search?.hits?.hits || [];
  const totalCount = response?.search?.hits?.total?.value || 0;

  const data = hits.map((hit) => ({
    _id: hit._id,
    name: hit._source.name,
    description: hit._source.description,
    privacy: hit._source.privacy,
    ownerId: hit._source.ownerId,
  }));

  return { data, totalCount };
}
