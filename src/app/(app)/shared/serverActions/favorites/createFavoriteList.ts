'use server';

import {
  CreateFavoriteListDto,
  FavoriteListControllerCreateData,
  FavoriteListItemDto,
} from '@/lib/api/generated/data-contracts';
import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export const createFavoriteList = async (
  data: CreateFavoriteListDto,
  tenantId: string,
): Promise<FavoriteListItemDto | null> => {
  try {
    const response = await favoriteListApiClient.favoriteListControllerCreate(
      { tenant_id: tenantId },
      data,
      {
        cache: 'no-store',
        format: 'json',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

    const responseData: FavoriteListControllerCreateData = response.data;

    if (!responseData) {
      return null;
    }

    return responseData;
  } catch {
    return null;
  }
};
