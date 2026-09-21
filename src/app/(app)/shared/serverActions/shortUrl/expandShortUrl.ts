'use server';

import { API_URL } from '../../lib/constants';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { getApiHeaders } from '../../lib/get-api-headers';

export async function expandShortUrl(
  id: string,
  tenantId: string,
): Promise<string | null> {
  const data = await fetchWrapper(`${API_URL}/short-url/${id}`, {
    headers: await getApiHeaders(tenantId),
    cache: 'no-store',
  });

  if (!data) {
    return null;
  }
  return data.url;
}
