'use server';

import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export type SyncLocalFavoriteListResult = 'created' | 'exists';

const MAX_LOCAL_FAVORITES_SYNC = 100;

export const syncLocalFavoriteList = async (
  resourceIds: string[],
  tenantId: string,
): Promise<SyncLocalFavoriteListResult> => {
  // Cap incoming resourceIds to prevent unbounded API work
  const cappedResourceIds = resourceIds.slice(0, MAX_LOCAL_FAVORITES_SYNC);

  try {
    const response =
      await favoriteListApiClient.favoriteListControllerSyncLocalList(
        { tenant_id: tenantId },
        {
          resourceIds: cappedResourceIds,
        },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return response.status === 201 ? 'created' : 'exists';
  } catch {
    return 'exists';
  }
};
