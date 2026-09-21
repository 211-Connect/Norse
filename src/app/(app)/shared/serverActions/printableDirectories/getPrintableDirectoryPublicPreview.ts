'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesPublicApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

export async function getPrintableDirectoryPublicPreview(
  slug: string,
  locale: string,
  tenantId: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  try {
    const tenantApiKeyHeaders = await getTenantApiKeyHeaders(tenantId);
    const response =
      await printableDirectoriesPublicApiClient.printableDirectoryPublicControllerPreview(
        { slug, locale, tenant_id: tenantId },
        {
          headers: { 'x-tenant-id': tenantId, ...tenantApiKeyHeaders },
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
