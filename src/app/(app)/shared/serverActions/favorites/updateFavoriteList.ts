'use server';

import { UpdateFavoriteListDto } from '@/lib/api/generated/data-contracts';
import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export const updateFavoriteList = async (
  id: string,
  data: UpdateFavoriteListDto,
  tenantId: string,
) => {
  try {
    const response = await favoriteListApiClient.favoriteListControllerUpdate(
      { id, tenant_id: tenantId },
      data,
      {
        cache: 'no-store',
        format: 'json',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

    return response.data;
  } catch {
    return null;
  }
};
