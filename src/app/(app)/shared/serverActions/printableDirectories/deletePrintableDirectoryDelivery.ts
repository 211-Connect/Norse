'use server';

import {
  getApiHeaders,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';

import {
  getScheduledDeliveryAccess,
  toDeliveryError,
} from '../../utils/printableDirectoryDeliveryAccess';
import { PrintableDirectoryDeliveryResult } from './printableDirectoryDeliveryResult';

export async function deletePrintableDirectoryDelivery(
  directoryId: string,
  deliveryId: string,
  tenantId: string,
): Promise<PrintableDirectoryDeliveryResult<null>> {
  const { error } = await getScheduledDeliveryAccess(tenantId);
  if (error) {
    return { success: false, error };
  }

  try {
    await printableDirectoryDeliveriesApiClient.printableDirectoryDeliveryControllerRemove(
      { id: directoryId, deliveryId, tenant_id: tenantId },
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

    return { success: true, data: null };
  } catch (apiError) {
    return { success: false, error: toDeliveryError(apiError) };
  }
}
