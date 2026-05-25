'use server';

import { getAuthHeaders } from '../../lib/authHeaders';
import {
  API_URL,
  FAVORITES_LIST_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';

export type SyncLocalFavoriteListResult = 'created' | 'exists';

const MAX_LOCAL_FAVORITES_SYNC = 100;

export const syncLocalFavoriteList = async (
  resourceIds: string[],
  tenantId?: string,
): Promise<SyncLocalFavoriteListResult> => {
  // Cap incoming resourceIds to prevent unbounded API work
  const cappedResourceIds = resourceIds.slice(0, MAX_LOCAL_FAVORITES_SYNC);

  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/sync${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetchWrapper<Response>(url, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
    },
    body: {
      resourceIds: cappedResourceIds,
    },
    cache: 'no-store',
    parseResponse: false,
  });

  if (!response) {
    throw new Error('No response from favorite list sync endpoint');
  }

  return response.status === 201 ? 'created' : 'exists';
};
