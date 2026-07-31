'use server';

import { createLogger } from '@/lib/logger';
import { getAuthHeaders } from '../../lib/authHeaders';
import { favoriteListApiClient } from '@/lib/api/clients';

const log = createLogger('getFavoriteList');

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId?: string,
) {
  const headers = await getAuthHeaders(tenantId);
  const response = await favoriteListApiClient.favoriteListControllerFindOne(
    { id, locale, tenant_id: tenantId },
    { headers },
  );

  if (!response.data) {
    log.error(response.error, `Failed to fetch favorite list with id: ${id}`);
    return null;
  }

  return response.data;
}
