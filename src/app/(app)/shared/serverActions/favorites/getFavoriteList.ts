'use server';

import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId?: string,
) {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams({ locale });
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}?${searchParams.toString()}`;
  return fetchWrapper(url, {
    headers: {
      ...authHeaders,
      'accept-language': locale,
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    cache: 'no-store',
  });
}
