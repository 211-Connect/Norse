'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesPublicApiClient } from '@/lib/api/clients';

export async function getPrintableDirectoryPublicPreview(
  slug: string,
  locale: string,
  tenantId?: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  try {
    const response =
      await printableDirectoriesPublicApiClient.printableDirectoryPublicControllerPreview(
        { slug, locale, ...(tenantId ? { tenant_id: tenantId } : {}) },
        {
          headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
          cache: 'no-store',
        },
      );

    if (!response.ok) {
      return null;
    }

    return response.data;
  } catch {
    return null;
  }
}
