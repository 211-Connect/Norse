import {
  type DeliveryTestOutcome,
  type DeliveryTestRequest,
  sendDeliveryTest as sendDeliveryTestInProcess,
} from '@/app/(app)/shared/services/scheduled-pdf-delivery/send-delivery-test';

import { cmsRequest } from './client';
import { isCmsRemote } from './config';

/** Rendering and emailing a large directory can take a while. */
const SEND_TEST_TIMEOUT_MS = 120_000;

/** "Send to me now": the CMS renders the PDF and emails it. */
export async function sendDeliveryTest(
  request: DeliveryTestRequest,
): Promise<DeliveryTestOutcome> {
  if (!isCmsRemote()) return sendDeliveryTestInProcess(request);

  return cmsRequest<DeliveryTestOutcome>(
    'printable-directory-deliveries/test',
    {
      method: 'POST',
      body: request,
      timeoutMs: SEND_TEST_TIMEOUT_MS,
    },
  );
}
