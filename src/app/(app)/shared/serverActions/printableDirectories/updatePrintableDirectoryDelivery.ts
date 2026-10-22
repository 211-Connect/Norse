'use server';

import {
  deliveryInputSchema,
  DeliveryInput,
} from '@/app/(app)/features/printable-directories/utils/scheduledDelivery';
import {
  getApiHeaders,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';
import { UpdatePrintableDirectoryDeliveryDto } from '@/lib/api/generated/data-contracts';

import {
  getScheduledDeliveryAccess,
  toDeliveryError,
} from '../../utils/printableDirectoryDeliveryAccess';
import { PrintableDirectoryDeliveryResult } from './printableDirectoryDeliveryResult';

/**
 * Replaces a delivery's settings (`input`), or only toggles it when `input`
 * is `{ enabled }`.
 */
export async function updatePrintableDirectoryDelivery(
  directoryId: string,
  deliveryId: string,
  input: DeliveryInput | { enabled: boolean },
  tenantId: string,
): Promise<PrintableDirectoryDeliveryResult> {
  const { error } = await getScheduledDeliveryAccess(tenantId);
  if (error) {
    return { success: false, error };
  }

  let payload: UpdatePrintableDirectoryDeliveryDto;
  if ('frequency' in input) {
    const parsed = deliveryInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'invalid' };
    }
    payload = parsed.data;
  } else if (typeof input.enabled === 'boolean') {
    payload = { enabled: input.enabled };
  } else {
    return { success: false, error: 'invalid' };
  }

  try {
    const response =
      await printableDirectoryDeliveriesApiClient.printableDirectoryDeliveryControllerUpdate(
        { id: directoryId, deliveryId, tenant_id: tenantId },
        payload,
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return { success: true, data: response.data };
  } catch (apiError) {
    return { success: false, error: toDeliveryError(apiError) };
  }
}
