import type {
  CollectionAfterChangeHook,
  PayloadRequest,
  TypedLocale,
} from 'payload';

import { buildAppConfigFromResourceDirectory } from '@/app/(app)/shared/utils/buildAppConfig';
import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import type { ResourceDirectory, Tenant } from '@/payload/payload-types';

import {
  getPublicAppConfigKey,
  toPublicAppConfig,
} from '../utilities/toPublicAppConfig';

const log = createLogger('pushPublicAppConfigToCache');

/**
 * Writes the tenant's public app config, one entry per enabled locale, to
 * Redis DB 2 (`public_app_config:<tenantId>:<locale>`), where Norse-API
 * serves it as `appConfig` on `GET /tenant-config/:tenantId`.
 *
 * Reads go through `req`, so they run inside the save's transaction and see
 * the saved data. The config is built by the same function as the website's
 * (`buildAppConfigFromResourceDirectory`), so the two cannot drift. A tenant
 * whose resource directory service is off gets no entries, as the website
 * then serves no directory either.
 */
export async function pushPublicAppConfigToCache(
  tenantId: string,
  req: PayloadRequest,
): Promise<void> {
  const { payload } = req;
  try {
    const tenant = (await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      depth: 0,
      req,
    })) as Tenant | null;

    if (!tenant?.services?.resourceDirectory) {
      await apiConfigCacheService.delPattern(
        getPublicAppConfigKey(tenantId, '*'),
      );
      log.info(
        { tenantId },
        'Resource directory off; public app config removed',
      );
      return;
    }

    const findDirectory = async (locale: string) =>
      payload
        .find({
          collection: 'resource-directories',
          where: { tenant: { equals: tenantId } },
          locale: locale as TypedLocale,
          depth: 1,
          limit: 1,
          pagination: false,
          req,
        })
        .then((result) => (result.docs[0] as ResourceDirectory) ?? null);

    const english = await findDirectory('en');
    let written = 0;

    for (const locale of tenant.enabledLocales ?? []) {
      const directory = locale === 'en' ? english : await findDirectory(locale);
      if (!directory) continue;

      const config = buildAppConfigFromResourceDirectory(
        directory,
        locale === 'en' ? null : english,
        locale,
      );
      await apiConfigCacheService.set(
        getPublicAppConfigKey(tenantId, locale),
        JSON.stringify(toPublicAppConfig(tenantId, locale, config)),
      );
      written++;
    }

    log.info({ tenantId, locales: written }, 'Public app config cache updated');
  } catch (error) {
    log.error(
      { err: error, tenantId },
      'Error pushing public app config to cache',
    );
  }
}

export const pushPublicAppConfigFromResourceDirectory: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, req }) => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;
  if (typeof tenantId === 'string') {
    await pushPublicAppConfigToCache(tenantId, req);
  }
  return doc;
};

/** Tenant saves change `i18n`, the enabled locales and the service switch. */
export const pushPublicAppConfigFromTenant: CollectionAfterChangeHook<
  Tenant
> = async ({ doc, req }) => {
  if (typeof doc.id === 'string') {
    await pushPublicAppConfigToCache(doc.id, req);
  }
  return doc;
};
