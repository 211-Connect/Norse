'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesPublicApiClient } from '@/lib/api';

export async function getPrintableDirectoryPublicPreview(
  slug: string,
  locale: string,
  tenantId: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  try {
    const response =
      await printableDirectoriesPublicApiClient.printableDirectoryPublicControllerPreview(
        { slug, locale, tenant_id: tenantId },
        {
          headers: await getApiHeaders(tenantId, locale),
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
