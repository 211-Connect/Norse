import { PayloadRequest } from 'payload';

import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';
import { shouldSkipSideEffects } from '@/payload/utilities/hookContext';

const log = createLogger('invalidateApiCache');

// This hook runs inside the collection's DB transaction (afterChange, before
// commit), so keep the timeout short — an untimed call here can pin a
// Postgres connection for as long as norse-api takes to respond.
const CACHE_CLEAR_FETCH_TIMEOUT_MS = 5_000;

export async function invalidateApiCache({
  doc,
  req,
}: {
  doc: ResourceDirectory & { tenantId?: string };
  req?: PayloadRequest;
}): Promise<ResourceDirectory> {
  // Translation jobs write each locale individually; they run this once after all locales instead.
  if (shouldSkipSideEffects(req?.context)) {
    return doc;
  }

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
      signal: AbortSignal.timeout(CACHE_CLEAR_FETCH_TIMEOUT_MS),
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
