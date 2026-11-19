'use server';

import { createLogger } from '@/lib/logger';
import { favoriteListApiClient, getApiHeaders } from '@/lib/api';
import { FavoriteListControllerFindOneData } from '@/lib/api/generated/data-contracts';

import { getApiErrorStatus } from '../../utils/printableDirectoryServerAccess';

const log = createLogger('getFavoriteList');

export type FetchFavoriteListResult =
  | { ok: true; data: FavoriteListControllerFindOneData }
  | { ok: false; status: number | undefined };

/**
 * Fetches a favorite list and reports why it failed instead of throwing.
 * The generated API client throws the failed `Response` for any non-2xx, so
 * without this a private (401/403) or missing (404) list would surface as a
 * generic 500 "servers are busy" page.
 */
export async function fetchFavoriteList(
  id: string,
  locale: string,
  tenantId: string,
): Promise<FetchFavoriteListResult> {
  try {
    const response = await favoriteListApiClient.favoriteListControllerFindOne(
      { id, locale, tenant_id: tenantId },
      {
        headers: await getApiHeaders(tenantId, locale, true),
      },
    );

    if (!response.data) {
      log.error(
        { id, tenantId, status: response.status },
        'Favorite list response had no data',
      );
      return { ok: false, status: response.status };
    }

    return { ok: true, data: response.data };
  } catch (error) {
    const status = getApiErrorStatus(error);
    const logPayload = { id, tenantId, status };

    if (status === 401 || status === 403 || status === 404) {
      log.info(logPayload, 'Favorite list is private or does not exist');
    } else {
      log.error({ ...logPayload, err: error }, 'Failed to fetch favorite list');
    }

    return { ok: false, status };
  }
}

export async function getFavoriteList(
  id: string,
  locale: string,
  tenantId: string,
) {
  const result = await fetchFavoriteList(id, locale, tenantId);

  return result.ok ? result.data : null;
}
