'use server';

import { headers } from 'next/headers';

import { getDeliveryClock } from '@/app/(app)/features/printable-directories/utils/deliveryClock';
import {
  getApiHeaders,
  printableDirectoriesApiClient,
  printableDirectoryDeliveriesApiClient,
} from '@/lib/api';
import { sendDeliveryTest } from '@/lib/cms/printable-directory-deliveries';

import { getSession } from '../../utils/getServerSession';
import {
  consumeTestSendQuota,
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

  // Each test renders a PDF on the server and sends an email.
  if (!(await consumeTestSendQuota(tenantId, userEmail))) {
    return { success: false, error: 'rate_limited' };
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

    const outcome = await sendDeliveryTest({
      tenantId,
      host,
      userEmail,
      delivery: {
        id: delivery.id,
        print: delivery.print,
        recipients: delivery.recipients,
        createdByEmail: delivery.createdByEmail,
      },
      directory: {
        id: directory.id,
        name: directory.name,
        slug: directory.slug ?? null,
        primaryLanguage: directory.primaryLanguage,
        locales: directory.locales,
      },
      date: getDeliveryClock().date,
    });

    if (outcome.status === 'wrong_tenant') {
      return { success: false, error: 'unauthorized' };
    }
    if (outcome.status === 'skipped') {
      return { success: false, error: 'empty' };
    }
    if (outcome.status === 'failed') {
      return { success: false, error: 'unknown' };
    }

    return { success: true, data: { status: outcome.status } };
  } catch (apiError) {
    return { success: false, error: toDeliveryError(apiError) };
  }
}
