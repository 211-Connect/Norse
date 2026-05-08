import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { clearMemoryCache } from '@/utilities/withCache';
import type { Endpoint } from 'payload';

import { isSuperAdmin } from '../collections/Users/access/roles';

const log = createLogger('clearCacheEndpoint');

export const clearCache: Endpoint = {
  path: '/clear-cache',
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

    try {
      log.info({ userId: req.user.id }, 'Clearing cache');
      clearMemoryCache();
      await cacheService.clear();
      log.info('Cache cleared successfully');
      return Response.json({ status: 'cache cleared' }, { status: 200 });
    } catch (error) {
      log.error({ err: error }, 'Error clearing cache');
      return Response.json({ status: 'cache not cleared' }, { status: 500 });
    }
  },
};
