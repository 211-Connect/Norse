'use server';

import { createLogger } from '@/lib/logger';

import { API_URL, FAVORITES_BASE_ENDPOINT } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

const log = createLogger('addToFavoriteList');

export const addToFavoriteList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId: string,
): Promise<any> => {
  const searchParams = new URLSearchParams();
  searchParams.append('tenant_id', tenantId);

  const url = `${API_URL}/${FAVORITES_BASE_ENDPOINT}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const headers = {
    ...(await getApiHeaders(tenantId)),
    'Content-Type': 'application/json',
    'x-api-version': '1',
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
