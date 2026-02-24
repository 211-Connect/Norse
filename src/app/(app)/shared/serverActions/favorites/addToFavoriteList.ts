'use server';

import {
  API_URL,
  FAVORITES_BASE_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { createLogger } from '@/lib/logger';

const log = createLogger('addToFavoriteList');

export const addToFavoriteList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId?: string,
): Promise<any> => {
  const authHeaders = await getAuthHeaders(tenantId);

  const searchParams = new URLSearchParams();
  if (tenantId) {
    searchParams.append('tenant_id', tenantId);
  }

  const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const headers = {
    ...authHeaders,
    'Content-Type': 'application/json',
    'x-api-version': '1',
    'x-api-key': INTERNAL_API_KEY || '',
  };
  const body = {
    resourceId: resourceId,
    favoriteListId: favoriteListId,
  };

  log.debug(
    { url, resourceId, favoriteListId, tenantId },
    'addToFavoriteList request',
  );

  try {
    const response = await fetchWrapper<any>(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    log.debug(
      { resourceId, favoriteListId, tenantId },
      'addToFavoriteList succeeded',
    );
    return response;
  } catch (error: any) {
    log.error(
      { err: error, status: error.response?.status, tenantId },
      'addToFavoriteList failed',
    );
    if (error.response?.status === 409) {
      return null;
    }
    throw error;
  }
};
