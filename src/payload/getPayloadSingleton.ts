import { getPayload, Payload } from 'payload';
import config from './payload-config';

/**
 * Singleton pattern for Payload instance to prevent memory leaks
 * from creating multiple Payload instances per request
 */
let cachedPayload: Payload | null = null;
let initPromise: Promise<Payload> | null = null;

export async function getPayloadSingleton(): Promise<Payload> {
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
