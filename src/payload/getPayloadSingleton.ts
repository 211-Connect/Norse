import { getPayload, Payload } from 'payload';
import config from './payload-config';

/**
 * Singleton pattern for Payload instance to prevent memory leaks
 * from creating multiple Payload instances per request
 */
const globalWithPayload = global as typeof global & {
  cachedPayload: Payload | null;
  initPromise: Promise<Payload> | null;
};

globalWithPayload.cachedPayload ??= null;
globalWithPayload.initPromise ??= null;

export async function getPayloadSingleton(): Promise<Payload> {
  // If we already have a cached instance, return it
  if (globalWithPayload.cachedPayload) {
    return globalWithPayload.cachedPayload;
  }

  // If initialization is in progress, wait for it
  if (globalWithPayload.initPromise) {
    return globalWithPayload.initPromise;
  }

  // Start initialization
  globalWithPayload.initPromise = getPayload({ config })
    .then((payload) => {
      globalWithPayload.cachedPayload = payload;
      globalWithPayload.initPromise = null;
      return payload;
    })
    .catch((error) => {
      globalWithPayload.initPromise = null;
      throw error;
    });

  return globalWithPayload.initPromise;
}

// Export for use in actions
export { config };
