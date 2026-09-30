'use server';

import {
  FavoriteListControllerFindAllParams,
  FavoriteListResponseDto,
} from '@/lib/api/generated/data-contracts';
import { favoriteListApiClient, getApiHeaders } from '@/lib/api';

export async function getFavoriteLists(
  tenantId: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  locale: string = 'en',
  resourceId?: string,
): Promise<FavoriteListResponseDto> {
  const params: FavoriteListControllerFindAllParams = {
    tenant_id: tenantId,
    page,
    limit,
    ...(search ? { search } : {}),
    ...(resourceId ? { resource_id: resourceId } : {}),
    locale,
  };

  try {
    const response = await favoriteListApiClient.favoriteListControllerFindAll(
      params,
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, locale, true),
      },
    );

    return response.data;
  } catch {
    return { items: [], page: 1, total: 0 };
  }
}
