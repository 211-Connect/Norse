import { CollectionAfterChangeHook, PayloadRequest } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';

import { findTenantById } from '../../Tenants/actions';
import { buildSuggestionsCache } from '../utilities/buildSuggestionsCache';
import { getSuggestionsKey } from '../utilities/getSuggestionsKey';

const log = createLogger('pushSuggestionsToCache');

export const pushSuggestionsToCache = async (
  doc: ResourceDirectory,
  req: PayloadRequest,
  locale: string | undefined = req.locale,
): Promise<ResourceDirectory> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping suggestions cache update',
    );
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId, false);

    if (!tenant?.enabledLocales) {
      log.warn(
        { tenantId },
        'No tenant or enabled locales found; skipping suggestions cache update',
      );
      return doc;
    }

    const { payload } = req;

    const suggestionsCache = await buildSuggestionsCache(
      payload,
      tenantId,
      tenant.enabledLocales,
      doc,
      locale,
    );

    if (!suggestionsCache) {
      log.info(
        { tenantId },
        'No suggestions found for tenant; skipping cache update',
      );
      return doc;
    }

    const cacheKey = getSuggestionsKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(suggestionsCache));

    log.info(
      { tenantId, suggestionCount: suggestionsCache.suggestions.length },
      'Suggestions cache updated',
    );
  } catch (error) {
    log.error({ err: error, tenantId }, 'Error pushing suggestions to cache');
  }

  return doc;
};

export const pushSuggestionsToCacheAfterChangeHook: CollectionAfterChangeHook<
  ResourceDirectory
> = ({ doc, req }) => pushSuggestionsToCache(doc, req);
