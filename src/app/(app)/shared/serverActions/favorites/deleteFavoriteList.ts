'use server';

import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export const deleteFavoriteList = async (
  id: string,
  tenantId: string,
): Promise<void | null> => {
  try {
    await favoriteListApiClient.favoriteListControllerRemove(
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
