'use server';

import { createLogger } from '@/lib/logger';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';
import { favoriteListApiClient } from '@/lib/api/clients';
import { getAuthHeaders } from '../../lib/authHeaders';

const log = createLogger('getFavoriteList');

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId: string,
) {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const response = await favoriteListApiClient.favoriteListControllerFindOne(
    { id, locale, tenant_id: tenantId },
    {
      headers: {
        ...authHeaders,
        ...tenantApiKeyHeaders,
        ['accept-language']: locale,
      },
    },
  );

  if (!response.data) {
    log.error(response.error, `Failed to fetch favorite list with id: ${id}`);
    return null;
  }

  return response.data;
}
