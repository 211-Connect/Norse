'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export type PrintableDirectoriesListResult = {
  items: PrintableDirectoryResponseDto[];
  total: number;
  page: number;
};

export async function getPrintableDirectories(
  tenantId: string,
  page: number = 1,
  limit: number = 50,
  search: string = '',
): Promise<PrintableDirectoriesListResult> {
  const response =
    await printableDirectoriesApiClient.printableDirectoryControllerList(
      {
        page,
        limit,
        search: search || undefined,
        tenant_id: tenantId,
      },
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

  return {
    items: response.data.items ?? [],
    total: response.data.total ?? 0,
    page: response.data.page ?? page,
  };
}
