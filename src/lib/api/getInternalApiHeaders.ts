import { getApiHeaders } from './getApiHeaders';

/**
 * Headers for Norse API internal (`InternalApiGuard`) endpoints: the
 * tenant's usual headers plus `x-internal-api-key`. Server-only.
 */
export async function getInternalHeaders(
  tenantId: string,
  locale = 'en',
): Promise<Record<string, string>> {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    throw new Error('INTERNAL_API_KEY is not configured');
  }

  return {
    ...(await getApiHeaders(tenantId, locale)),
    'x-internal-api-key': internalApiKey,
  };
}
