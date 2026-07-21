'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export type PrintableDirectoriesListResult = {
  items: PrintableDirectoryResponseDto[];
  total: number;
  page: number;
};

export async function getPrintableDirectories(
  tenantId?: string,
  page: number = 1,
  limit: number = 50,
  search: string = '',
): Promise<PrintableDirectoriesListResult> {
  const headers = await getAuthHeaders(tenantId);

  const response =
    await printableDirectoriesApiClient.printableDirectoryControllerList(
      {
        page,
        limit,
        search: search || undefined,
        tenant_id: tenantId || undefined,
      },
      {
        headers,
        cache: 'no-store',
      },
    );

  return {
    items: response.data.items ?? [],
    total: response.data.total ?? 0,
    page: response.data.page ?? page,
  };
}
