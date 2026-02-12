'use server';

import {
  API_URL,
  FAVORITES_BASE_ENDPOINT,
  INTERNAL_API_KEY,
} from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { fetchWrapper } from '../../lib/fetchWrapper';

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

  console.log('--- addToFavoriteList Request ---');
  console.log('URL:', url);
  console.log('Method: POST');
  console.log(
    'Headers:',
    JSON.stringify(
      {
        ...headers,
        Authorization: headers['Authorization'] ? 'Bearer ***' : undefined,
        'x-api-key': '***',
      },
      null,
      2,
    ),
  );
  console.log('Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetchWrapper<any>(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    console.log('--- addToFavoriteList Response ---');
    console.log('Status: Success');
    return response;
  } catch (error: any) {
    console.error('--- addToFavoriteList Error ---');
    console.error('Status:', error.response?.status);
    console.error('Error Body:', error.response?.data || error.message);
    if (error.response?.status === 409) {
      return null;
    }
    throw error;
  }
};
