import { CollectionAfterChangeHook } from 'payload';

import { createLogger } from '@/lib/logger';
import { pushHybridSearchConfigToCache } from '@/payload/collections/HybridSearchConfig/hooks/pushHybridSearchConfigToCache';
import { ResourceDirectory } from '@/payload/payload-types';

const log = createLogger('pushHybridSearchConfigToCacheFromResourceDirectory');

export const pushHybridSearchConfigToCacheFromResourceDirectory: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, req }) => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping hybrid search config cache update',
    );
    return doc;
  }

  await pushHybridSearchConfigToCache(tenantId, req, {
    resourceDirectory: doc,
  });

  return doc;
};
