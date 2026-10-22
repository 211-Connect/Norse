'use server';

import {
  getApiHeaders,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';
import { PrintableDirectoryDeliveryResponseDto } from '@/lib/api/generated/data-contracts';

import {
  getScheduledDeliveryAccess,
  toDeliveryError,
} from '../../utils/printableDirectoryDeliveryAccess';
import { PrintableDirectoryDeliveryResult } from './printableDirectoryDeliveryResult';

export async function getPrintableDirectoryDeliveries(
  directoryId: string,
  tenantId: string,
): Promise<
  PrintableDirectoryDeliveryResult<PrintableDirectoryDeliveryResponseDto[]>
> {
  const { error } = await getScheduledDeliveryAccess(tenantId);
  if (error) {
    return { success: false, error };
  }

  try {
    const response =
      await printableDirectoryDeliveriesApiClient.printableDirectoryDeliveryControllerList(
        { id: directoryId, tenant_id: tenantId },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return { success: true, data: response.data.items };
  } catch (apiError) {
    return { success: false, error: toDeliveryError(apiError) };
  }
}
