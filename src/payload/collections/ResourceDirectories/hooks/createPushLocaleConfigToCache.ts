import type {
  CollectionAfterChangeHook,
  Payload,
  PayloadRequest,
} from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import type { ResourceDirectory } from '@/payload/payload-types';

import { findTenantById } from '../../Tenants/actions';

type BuildFn<T> = (
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  doc: ResourceDirectory,
  locale: string | undefined,
) => Promise<Map<string, T> | null>;

type GetKeyFn = (tenantId: string, locale: string) => string;

export function createPushLocaleConfigToCache<T>(
  buildFn: BuildFn<T>,
  getKeyFn: GetKeyFn,
  loggerName: string,
  configLabel: string,
): {
  pushToCache: (
    doc: ResourceDirectory,
    req: PayloadRequest,
    locale?: string,
  ) => Promise<ResourceDirectory>;
  afterChangeHook: CollectionAfterChangeHook<ResourceDirectory>;
} {
  const log = createLogger(loggerName);

  const pushToCache = async (
    doc: ResourceDirectory,
    req: PayloadRequest,
    locale: string | undefined = req.locale,
  ): Promise<ResourceDirectory> => {
    const tenantId =
      typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

    if (typeof tenantId !== 'string') {
      log.warn(
        { tenantId },
        `Invalid tenant ID; skipping ${configLabel} cache update`,
      );
      return doc;
    }

    try {
      const tenant = await findTenantById(tenantId, false);

      if (!tenant?.enabledLocales) {
        log.warn(
          { tenantId },
          `No tenant or enabled locales found; skipping ${configLabel} cache update`,
        );
        return doc;
      }

      const { payload } = req;
      const byLocale = await buildFn(
        payload,
        tenantId,
        tenant.enabledLocales,
        doc,
        locale,
      );

      if (!byLocale) {
        log.info(
          { tenantId },
          `No ${configLabel} built for tenant; skipping cache update`,
        );
        return doc;
      }

      for (const [localeKey, config] of byLocale.entries()) {
        const cacheKey = getKeyFn(tenantId, localeKey);
        await apiConfigCacheService.set(cacheKey, JSON.stringify(config));
      }

      log.info(
        { tenantId, localeCount: byLocale.size },
        `${configLabel} cache updated`,
      );
    } catch (error) {
      log.error(
        { err: error, tenantId },
        `Error pushing ${configLabel} to cache`,
      );
    }

    return doc;
  };

  const afterChangeHook: CollectionAfterChangeHook<ResourceDirectory> = ({
    doc,
    req,
  }) => pushToCache(doc, req);

  return { pushToCache, afterChangeHook };
}
