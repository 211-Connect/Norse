import type {
  DeliveryTestOutcome,
  DeliveryTestRequest,
} from '@/app/(app)/shared/services/scheduled-pdf-delivery/send-delivery-test';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** Rendering and emailing a large directory can take a while. */
const SEND_TEST_TIMEOUT_MS = 120_000;

/** "Send to me now": the CMS renders the PDF and emails it. */
export async function sendDeliveryTest(
  request: DeliveryTestRequest,
): Promise<DeliveryTestOutcome> {
  // Dropped from the public app's build (see ./tenants.ts).
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { sendDeliveryTest: sendInProcess } =
        await import('@/app/(app)/shared/services/scheduled-pdf-delivery/send-delivery-test');
      return sendInProcess(request);
    }
  }

  return cmsRequest<DeliveryTestOutcome>(
    'printable-directory-deliveries/test',
    { method: 'POST', body: request, timeoutMs: SEND_TEST_TIMEOUT_MS },
  );
}
