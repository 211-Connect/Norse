'use server';

import {
  deliveryInputSchema,
  DeliveryInput,
} from '@/app/(app)/features/printable-directories/utils/scheduledDelivery';
import {
  getApiHeaders,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';

import {
  getScheduledDeliveryAccess,
  toDeliveryError,
} from '../../utils/printableDirectoryDeliveryAccess';
import { PrintableDirectoryDeliveryResult } from './printableDirectoryDeliveryResult';

export async function createPrintableDirectoryDelivery(
  directoryId: string,
  input: DeliveryInput,
  tenantId: string,
): Promise<PrintableDirectoryDeliveryResult> {
  const { error } = await getScheduledDeliveryAccess(tenantId);
  if (error) {
    return { success: false, error };
  }

  const parsed = deliveryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'invalid' };
  }

  try {
    const response =
      await printableDirectoryDeliveriesApiClient.printableDirectoryDeliveryControllerCreate(
        { id: directoryId, tenant_id: tenantId },
        parsed.data,
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
