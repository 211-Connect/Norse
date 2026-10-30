import {
  type DeliveryTestRequest,
  sendDeliveryTest,
} from '@/app/(app)/shared/services/scheduled-pdf-delivery/send-delivery-test';
import { internalRoute } from '@/lib/cms/internal-route';

/** Rendering a large directory can take a while. */
export const maxDuration = 120;

/**
 * POST DeliveryTestRequest → renders the delivery's PDF and emails it to the
 * requesting user only ("Send to me now"). The public app has already
 * checked the user's access and the per-user rate limit.
 */
export const POST = internalRoute(async (request) => {
  const body = (await request
    .json()
    .catch(() => null)) as DeliveryTestRequest | null;

  if (
    typeof body?.tenantId !== 'string' ||
    typeof body?.host !== 'string' ||
    typeof body?.userEmail !== 'string' ||
    typeof body?.date !== 'string' ||
    typeof body?.delivery?.id !== 'string' ||
    typeof body?.directory?.id !== 'string'
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  return sendDeliveryTest(body);
});
