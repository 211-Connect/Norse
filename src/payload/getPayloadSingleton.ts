import { Payload, getPayload } from 'payload';

import { createLogger } from '@/lib/logger';
import { getNorseRole } from '@/lib/norse-role';

import config from './payload-config';

const log = createLogger('payload');

/** Call sites already reported, so each logs once per process. */
const reportedAppRoleCallers = new Set<string>();

/**
 * The public app (`NORSE_ROLE=app`) must not use Payload: everything it
 * needs comes from the CMS over HTTP (docs/cms-app-separation-plan.md).
 * Until every call site is migrated this only logs the caller, once each,
 * so the remaining ones show up in production logs; phase 4 makes it throw.
 */
function reportUseInAppRole(): void {
  if (getNorseRole() !== 'app') return;

  const stack = new Error().stack?.split('\n').slice(2, 8).join('\n') ?? '';
  const caller = stack.split('\n')[1]?.trim() ?? 'unknown';
  if (reportedAppRoleCallers.has(caller)) return;
  reportedAppRoleCallers.add(caller);

  log.warn(
    { event: 'payload_used_in_app_role', caller, stack },
    'Payload used in the public app (NORSE_ROLE=app)',
  );
}

/**
 * Singleton pattern for Payload instance to prevent memory leaks
 * from creating multiple Payload instances per request
 */
let cachedPayload: Payload | null = null;
let initPromise: Promise<Payload> | null = null;

export async function getPayloadSingleton(): Promise<Payload> {
  reportUseInAppRole();

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
