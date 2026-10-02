'use server';

import { getApiHeaders } from '@/lib/api';
import { shortUrlApiClient } from '@/lib/api/clients';

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
