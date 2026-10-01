import type { CollectionAfterChangeHook } from 'payload';

import { createLogger } from '@/lib/logger';
import type { ResourceDirectory } from '@/payload/payload-types';

import { syncResourceDirectoryKeycloakBranding } from './syncKeycloakRealmBranding';

const log = createLogger('syncKeycloakRealmBrandingAfterChange');

export const syncKeycloakRealmBrandingAfterChange: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') {
    return doc;
  }

  try {
    await syncResourceDirectoryKeycloakBranding(req, doc);
  } catch (error) {
    log.error(
      { err: error, docId: doc.id, operation },
      'Failed to synchronize branding to Keycloak; save continues',
    );
  }

  return doc;
};
