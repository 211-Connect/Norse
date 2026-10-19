import { getApiHeaders } from '@/lib/api';
import { printableDirectoryDeliveriesInternalApiClient } from '@/lib/api/clients';
import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';

/** Headers for the Norse API's internal scheduled delivery endpoints. */
export async function getInternalHeaders(
  tenantId: string,
  locale = 'en',
): Promise<Record<string, string>> {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    throw new Error('INTERNAL_API_KEY is not configured');
  }

  return {
    ...(await getApiHeaders(tenantId, locale)),
    'x-internal-api-key': internalApiKey,
  };
}

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
