import type { Endpoint } from 'payload';

import { createLogger } from '@/lib/logger';
import { defaultLocale } from '@/payload/i18n/locales';
import { Tenant } from '@/payload/payload-types';

import { pushOrchestrationConfigToCache } from '../collections/OrchestrationConfig/hooks/pushOrchestrationConfigToCache';
import { pushFacetsToCache } from '../collections/ResourceDirectories/hooks/pushFacetsToCache';
import { pushEnabledLocalesToCache } from '../collections/Tenants/hooks/pushEnabledLocalesToCache';
import { pushRealmIdToCache } from '../collections/Tenants/hooks/pushRealmIdToCache';
import { pushAnalyticsConfigToCache } from '../collections/Tenants/hooks/pushAnalyticsConfig';
import { isSuperAdmin } from '../collections/Users/access/roles';

const log = createLogger('populateApiConfigCacheEndpoint');

export const populateApiConfigCache: Endpoint = {
  path: '/populate-api-config-cache',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      log.warn('Unauthorized: no user session');
      return Response.json({ status: 'unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(req.user)) {
      log.warn(
        { userId: req.user.id, roles: req.user.roles },
        'Forbidden: insufficient permissions',
      );
      return Response.json(
        { status: 'forbidden', message: 'Super admin access required' },
        { status: 403 },
      );
    }

    const { payload } = req;

    try {
      const tenants: Tenant[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = await payload.find({
          collection: 'tenants',
          limit: 100,
          page,
          pagination: true,
        });

        tenants.push(...result.docs);
        hasNextPage = result.hasNextPage;
        page += 1;
      }

      let realmIdTriggered = 0;
      let enabledLocalesTriggered = 0;
      let facetsTriggered = 0;
      let orchestrationConfigTriggered = 0;
      let analyticsConfigTriggered = 0;

      for (const tenant of tenants) {
        const tenantId = tenant.id;

        if (typeof tenantId !== 'string') {
          log.warn({ tenantId }, 'Skipping tenant with invalid ID');
          continue;
        }

        await pushRealmIdToCache(tenant);
        realmIdTriggered++;

        await pushEnabledLocalesToCache(tenant);
        enabledLocalesTriggered++;

        await pushAnalyticsConfigToCache(tenant);
        analyticsConfigTriggered++;

        const [resourceDirectory] = await payload
          .find({
            collection: 'resource-directories',
            where: {
              tenant: {
                equals: tenantId,
              },
            },
            locale: defaultLocale,
            limit: 1,
          })
          .then((result) => result.docs);

        if (resourceDirectory) {
          await pushFacetsToCache(resourceDirectory, req, defaultLocale);
          facetsTriggered++;
        }

        const [orchestrationConfig] = await payload
          .find({
            collection: 'orchestration-config',
            where: {
              tenant: {
                equals: tenantId,
              },
            },
            locale: defaultLocale,
            limit: 1,
          })
          .then((result) => result.docs);

        if (orchestrationConfig) {
          await pushOrchestrationConfigToCache(
            orchestrationConfig,
            req,
            defaultLocale,
          );
          orchestrationConfigTriggered++;
        }
      }

      log.info(
        {
          userId: req.user.id,
          tenantsProcessed: tenants.length,
          realmIdTriggered,
          enabledLocalesTriggered,
          facetsTriggered,
          orchestrationConfigTriggered,
          analyticsConfigTriggered,
        },
        'API config cache population completed',
      );

      return Response.json(
        {
          status: 'ok',
          tenantsProcessed: tenants.length,
          realmIdTriggered,
          enabledLocalesTriggered,
          facetsTriggered,
          orchestrationConfigTriggered,
          analyticsConfigTriggered,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error({ err: error, userId: req.user.id }, 'Error populating cache');
      return Response.json(
        { status: 'error', message: 'Failed to populate API config cache' },
        { status: 500 },
      );
    }
  },
};
