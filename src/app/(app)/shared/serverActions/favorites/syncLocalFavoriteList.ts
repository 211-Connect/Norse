'use server';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export type SyncLocalFavoriteListResult = 'created' | 'exists';

const MAX_LOCAL_FAVORITES_SYNC = 100;

export const syncLocalFavoriteList = async (
  resourceIds: string[],
  tenantId: string,
): Promise<SyncLocalFavoriteListResult> => {
  // Cap incoming resourceIds to prevent unbounded API work
  const cappedResourceIds = resourceIds.slice(0, MAX_LOCAL_FAVORITES_SYNC);

  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/sync${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetchWrapper<Response>(url, {
    method: 'POST',
    headers: {
      ...(await getApiHeaders(tenantId)),
      'Content-Type': 'application/json',
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
