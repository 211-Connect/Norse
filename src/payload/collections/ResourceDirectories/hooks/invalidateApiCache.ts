import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';

const log = createLogger('invalidateApiCache');

export async function invalidateApiCache({ doc }): Promise<ResourceDirectory> {
  const tenantId = doc.tenantId || doc.id;

  log.debug({ tenantId }, 'Invalidating API cache for tenant');

  const apiUrl = process.env.API_URL;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!apiUrl) {
    log.warn('API_URL not configured; skipping cache invalidation');
    return doc;
  }

  if (!internalApiKey) {
    log.warn('INTERNAL_API_KEY not configured; skipping cache invalidation');
    return doc;
  }

  try {
    const response = await fetch(`${apiUrl}/cms-config/cache/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalApiKey,
      },
    });

    if (!response.ok) {
      log.error(
        { status: response.status, statusText: response.statusText },
        'Failed to invalidate API cache',
      );
    } else {
      log.info('API cache invalidated successfully');
    }
  } catch (error) {
    log.error({ err: error }, 'Error calling cache invalidation endpoint');
  }

  return doc;
}
