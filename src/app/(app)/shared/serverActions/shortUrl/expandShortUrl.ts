'use server';

import { shortUrlApiClient } from '@/lib/api/clients';

import { getApiHeaders } from '../../lib/get-api-headers';

export async function expandShortUrl(
  id: string,
  tenantId: string,
): Promise<string | null> {
  const response = await shortUrlApiClient.shortUrlControllerGetShortUrlById(
    { id },
    { headers: await getApiHeaders(tenantId) },
  );

  return response.data?.url ?? null;
}
