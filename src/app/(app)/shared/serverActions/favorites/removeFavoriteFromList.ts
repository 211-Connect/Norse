'use server';

import { getApiHeaders, favoriteApiClient } from '@/lib/api';

export const removeFavoriteFromList = async (
  {
    resourceId,
    favoriteListId,
  }: {
    resourceId: string;
    favoriteListId: string;
  },
  tenantId: string,
): Promise<void> => {
  await favoriteApiClient.favoriteControllerRemove(
    {
      favoriteId: resourceId,
      favoriteListId,
      tenant_id: tenantId,
    },
    {
      headers: await getApiHeaders(tenantId, 'en', true),
    },
  );
};
