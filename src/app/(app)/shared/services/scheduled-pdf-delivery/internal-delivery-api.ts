import { getInternalHeaders } from '@/lib/api';
import { printableDirectoryDeliveriesInternalApiClient } from '@/lib/api/clients';
import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';

/**
 * The delivery's directory preview, resolved as the directory owner (as for
 * a public share link), so a test send matches what recipients get whoever
 * triggers it.
 */
export async function loadDeliveryPreview(
  tenantId: string,
  deliveryId: string,
  locale: string,
): Promise<PrintableDirectoryPreviewResponseDto> {
  const { data } =
    await printableDirectoryDeliveriesInternalApiClient.printableDirectoryDeliveryInternalControllerPreview(
      { deliveryId, locale, tenant_id: tenantId },
      {
        headers: await getInternalHeaders(tenantId, locale),
        cache: 'no-store',
      },
    );
  return data;
}
