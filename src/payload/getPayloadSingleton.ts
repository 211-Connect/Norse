import { Payload, getPayload } from 'payload';

import { createLogger } from '@/lib/logger';
import { getNorseRole } from '@/lib/norse-role';

import config from './payload-config';

const log = createLogger('payload');

/**
 * The public app (`NORSE_ROLE=app`) must not use Payload: it has no
 * database, and everything it needs comes from the CMS over HTTP through
 * `@/lib/cms` (docs/cms-app-separation-plan.md). Fails loudly, with the
 * caller in the log, instead of a database connection error.
 */
function assertNotAppRole(): void {
  if (getNorseRole() !== 'app') return;

  const stack = new Error().stack?.split('\n').slice(2, 8).join('\n') ?? '';
  log.error(
    { event: 'payload_used_in_app_role', stack },
    'Payload used in the public app (NORSE_ROLE=app)',
  );
  throw new Error(
    'Payload is not available in the public app (NORSE_ROLE=app); use @/lib/cms',
  );
}

/**
 * Singleton pattern for Payload instance to prevent memory leaks
 * from creating multiple Payload instances per request
 */
let cachedPayload: Payload | null = null;
let initPromise: Promise<Payload> | null = null;

export async function getPayloadSingleton(): Promise<Payload> {
  assertNotAppRole();

  // If we already have a cached instance, return it
  if (cachedPayload) {
    return cachedPayload;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = getPayload({ config })
    .then((payload) => {
      cachedPayload = payload;
      initPromise = null;
      return payload;
    })
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

// Export for use in actions
export { config };
