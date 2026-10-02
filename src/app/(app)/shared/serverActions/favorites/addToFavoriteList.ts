'use server';

import { createLogger } from '@/lib/logger';
import { favoriteApiClient, getApiHeaders } from '@/lib/api';

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
) => {
  log.debug(
    { resourceId, favoriteListId, tenantId },
    'addToFavoriteList request',
  );

  try {
    const response = await favoriteApiClient.favoriteControllerCreate(
      {
        tenant_id: tenantId,
      },
      {
        resourceId,
        favoriteListId,
      },
      {
        format: 'json',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );
    log.debug(
      { resourceId, favoriteListId, tenantId },
      'addToFavoriteList succeeded',
    );
    // Only the plain JSON payload is serializable across the server
    // action boundary — the raw fetch `Response` object is not.
    return response.data;
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
