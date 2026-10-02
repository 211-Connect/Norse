'use server';

import { createLogger } from '@/lib/logger';
import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

const log = createLogger('getFavoriteList');

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId: string,
) {
  const response = await favoriteListApiClient.favoriteListControllerFindOne(
    { id, locale, tenant_id: tenantId },
    {
      headers: await getApiHeaders(tenantId, locale, true),
    },
  );

  if (!response.data) {
    log.error(response.error, `Failed to fetch favorite list with id: ${id}`);
    return null;
  }

  return response.data;
}
