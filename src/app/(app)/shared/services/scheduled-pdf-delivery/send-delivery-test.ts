import {
  DuePrintableDirectoryDeliveryDirectoryDto,
  PrintableDirectoryDeliveryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

import { deliverPrintableDirectoryPdf } from './deliver-printable-directory-pdf';
import { loadDeliveryPreview } from './internal-delivery-api';
import { getTenantDeliveryContext } from './tenant-delivery-context';

/** A "Send to me now" request, after the app checked the user's access. */
export type DeliveryTestRequest = {
  tenantId: string;
  /** The tenant host the user is on (links and branding come from it). */
  host: string;
  userEmail: string;
  delivery: Pick<
    PrintableDirectoryDeliveryResponseDto,
    'id' | 'print' | 'recipients' | 'createdByEmail'
  >;
  directory: DuePrintableDirectoryDeliveryDirectoryDto;
  /** `YYYY-MM-DD` in the delivery time zone. */
  date: string;
};

export type DeliveryTestOutcome = {
  status: 'sent' | 'sent_as_link' | 'skipped' | 'failed' | 'wrong_tenant';
};

/**
 * Renders a saved delivery's PDF and emails it to `userEmail` only. Sends
 * through Payload's email adapter, so it runs in the CMS; the public app's
 * `sendPrintableDirectoryDeliveryTest` action reaches it through
 * `@/lib/cms/printable-directory-deliveries`.
 */
export async function sendDeliveryTest({
  tenantId,
  host,
  userEmail,
  delivery,
  directory,
  date,
}: DeliveryTestRequest): Promise<DeliveryTestOutcome> {
  const context = await getTenantDeliveryContext(
    await getPayloadSingleton(),
    host,
  );
  if (context.tenantId !== tenantId) return { status: 'wrong_tenant' };

  const outcome = await deliverPrintableDirectoryPdf({
    context,
    delivery,
    directory,
    date,
    testRecipient: userEmail,
    loadPreview: (locale) => loadDeliveryPreview(tenantId, delivery.id, locale),
  });

  return { status: outcome.status };
}
