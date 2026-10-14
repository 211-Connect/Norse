'use server';

import { headers } from 'next/headers';

import { getDeliveryClock } from '@/app/(app)/features/printable-directories/utils/deliveryClock';
import { deliverPrintableDirectoryPdf } from '@/app/(app)/shared/services/scheduled-pdf-delivery/deliver-printable-directory-pdf';
import { getTenantDeliveryContext } from '@/app/(app)/shared/services/scheduled-pdf-delivery/tenant-delivery-context';
import {
  getApiHeaders,
  printableDirectoriesApiClient,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

import { getSession } from '../../utils/getServerSession';
import {
  getScheduledDeliveryAccess,
  toDeliveryError,
} from '../../utils/printableDirectoryDeliveryAccess';
import { PrintableDirectoryDeliveryResult } from './printableDirectoryDeliveryResult';

/**
 * "Send to me now": renders a saved delivery's PDF and emails it to the
 * signed-in user only. Doesn't touch the delivery's schedule or last run.
 */
export async function sendPrintableDirectoryDeliveryTest(
  directoryId: string,
  deliveryId: string,
  tenantId: string,
): Promise<
  PrintableDirectoryDeliveryResult<{ status: 'sent' | 'sent_as_link' }>
> {
  const { error } = await getScheduledDeliveryAccess(tenantId);
  if (error) {
    return { success: false, error };
  }

  const userEmail = (await getSession())?.user?.email;
  const host = (await headers()).get('host');
  if (!userEmail || !host) {
    return { success: false, error: 'unauthorized' };
  }

  try {
    const apiHeaders = await getApiHeaders(tenantId, 'en', true);
    const [{ data: deliveries }, { data: directory }] = await Promise.all([
      printableDirectoryDeliveriesApiClient.printableDirectoryDeliveryControllerList(
        { id: directoryId, tenant_id: tenantId },
        { cache: 'no-store', headers: apiHeaders },
      ),
      printableDirectoriesApiClient.printableDirectoryControllerGetById(
        { id: directoryId },
        { cache: 'no-store', headers: apiHeaders },
      ),
    ]);

    const delivery = deliveries.items.find((item) => item.id === deliveryId);
    if (!delivery) {
      return { success: false, error: 'not_found' };
    }

    const context = await getTenantDeliveryContext(
      await getPayloadSingleton(),
      host,
    );
    if (context.tenantId !== tenantId) {
      return { success: false, error: 'unauthorized' };
    }

    const outcome = await deliverPrintableDirectoryPdf({
      context,
      delivery,
      directory: {
        id: directory.id,
        name: directory.name,
        slug: directory.slug ?? null,
        primaryLanguage: directory.primaryLanguage,
        locales: directory.locales,
      },
      date: getDeliveryClock().date,
      testRecipient: userEmail,
      loadPreview: async (locale) => {
        const { data } =
          await printableDirectoriesApiClient.printableDirectoryControllerPreview(
            { id: directoryId, locale },
            {
              cache: 'no-store',
              headers: await getApiHeaders(tenantId, locale, true),
            },
          );
        return data;
      },
    });

    if (outcome.status === 'failed') {
      return { success: false, error: 'unknown' };
    }

    return { success: true, data: { status: outcome.status } };
  } catch (apiError) {
    return { success: false, error: toDeliveryError(apiError) };
  }
}
