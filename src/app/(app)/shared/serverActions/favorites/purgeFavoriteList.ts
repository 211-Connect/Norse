'use server';

import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export const purgeFavoriteList = async (
  id: string,
  tenantId: string,
): Promise<void | null> => {
  try {
    await favoriteListApiClient.favoriteListControllerPurge(
      { id, tenant_id: tenantId },
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );
  } catch {
    return null;
  }
};
