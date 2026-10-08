import type { Endpoint } from 'payload';

import { createLogger } from '@/lib/logger';
import { syncResourceDirectoryKeycloakBranding } from '@/payload/collections/ResourceDirectories/hooks/syncKeycloakRealmBranding';

import { isSuperAdmin } from '../collections/Users/access/roles';

const log = createLogger('syncKeycloakBrandingEndpoint');

export const syncKeycloakBranding: Endpoint = {
  path: '/sync-keycloak-branding',
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
      let page = 1;
      let hasNextPage = true;
      let synced = 0;
      let failed = 0;
      const errors: Array<{ docId: string; message: string }> = [];

      while (hasNextPage) {
        const result = await payload.find({
          collection: 'resource-directories',
          limit: 100,
          page,
          pagination: true,
          depth: 0,
        });

        for (const resourceDirectory of result.docs) {
          try {
            await syncResourceDirectoryKeycloakBranding(req, resourceDirectory);
            synced++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            log.error(
              { err: error, docId: resourceDirectory.id },
              'Failed to sync Keycloak branding for resource directory',
            );
            errors.push({ docId: resourceDirectory.id, message });
            failed++;
          }
        }

        hasNextPage = result.hasNextPage;
        page += 1;
      }

      log.info(
        {
          userId: req.user.id,
          synced,
          failed,
        },
        'Keycloak branding sync completed',
      );

      return Response.json(
        {
          status: failed === 0 ? 'ok' : 'partial',
          synced,
          failed,
          errors: errors.slice(0, 50),
        },
        { status: failed === 0 ? 200 : 207 },
      );
    } catch (error) {
      log.error({ err: error, userId: req.user.id }, 'Error syncing branding');
      return Response.json(
        { status: 'error', message: 'Failed to sync Keycloak branding' },
        { status: 500 },
      );
    }
  },
};
