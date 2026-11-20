import { CollectionAfterChangeHook } from 'payload';

import { createLogger } from '@/lib/logger';
import {
  HYBRID_SEARCH_CACHE_PUSH_FAILED_CONTEXT_KEY,
  pushHybridSearchConfigToCache,
} from '@/payload/collections/HybridSearchConfig/hooks/pushHybridSearchConfigToCache';
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

  const ok = await pushHybridSearchConfigToCache(tenantId, req, {
    resourceDirectory: doc,
  });
  if (!ok) req.context[HYBRID_SEARCH_CACHE_PUSH_FAILED_CONTEXT_KEY] = true;

  return doc;
};
