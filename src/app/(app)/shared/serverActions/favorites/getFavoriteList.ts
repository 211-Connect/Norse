'use server';

import { API_URL, FAVORITES_LIST_ENDPOINT } from '../../lib/constants';
import { getAuthHeaders } from '../../lib/authHeaders';
import { FetchError } from '../../lib/fetchError';

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId?: string,
) {
  try {
    const authHeaders = await getAuthHeaders(tenantId);

    const searchParams = new URLSearchParams({ locale });
    if (tenantId) {
      searchParams.append('tenant_id', tenantId);
    }

    const url = `${API_URL}/${FAVORITES_LIST_ENDPOINT}/${id}?${searchParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        ...authHeaders,
        'accept-language': locale,
        'x-api-version': '1',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
    return {};
  }
}
