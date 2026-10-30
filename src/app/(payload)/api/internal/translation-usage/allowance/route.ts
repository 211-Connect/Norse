import { readTranslationAllowance } from '@/app/(app)/shared/services/translation-usage/translation-usage-store';
import { internalRoute } from '@/lib/cms/internal-route';

/** POST { tenantId, userEmail } → whether the user may still translate. */
export const POST = internalRoute(async (request) => {
  const body = await request.json().catch(() => null);
  if (
    typeof body?.tenantId !== 'string' ||
    typeof body?.userEmail !== 'string'
  ) {
    return Response.json(
      { error: 'tenantId and userEmail are required' },
      { status: 400 },
    );
  }

  return readTranslationAllowance(body.tenantId, body.userEmail);
});
