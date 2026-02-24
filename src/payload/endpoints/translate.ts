import { Endpoint } from 'payload';
import {
  isSuperAdmin,
  isSupport,
  isTenant,
} from '../collections/Users/access/roles';
import { createLogger } from '@/lib/logger';

const log = createLogger('translateEndpoint');

export const translateEndpoint: Endpoint = {
  path: '/translate',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      log.warn('Unauthorized: no user session');
      return Response.json(
        { error: true, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const hasPermission =
      isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
    if (!hasPermission) {
      log.warn(
        { userId: req.user.id, roles: req.user.roles },
        'Forbidden: insufficient permissions',
      );
      return Response.json(
        { error: true, message: 'Forbidden: Insufficient permissions' },
        { status: 403 },
      );
    }

    const body = await req.json?.();
    const { tenantId, locales, engine, force } = body || {};

    if (isTenant(req.user) && !isSuperAdmin(req.user) && !isSupport(req.user)) {
      const userTenantIds =
        req.user.tenants?.map((t) => {
          if (typeof t === 'string') return t;
          if (typeof t.tenant === 'string') return t.tenant;
          return t.tenant.id;
        }) || [];

      if (!userTenantIds.includes(tenantId)) {
        log.warn(
          {
            userId: req.user.id,
            requestedTenantId: tenantId,
            userTenantIds,
          },
          'Forbidden: tenant does not own resource directory',
        );
        return Response.json(
          {
            error: true,
            message:
              'Forbidden: You can only translate your own resource directories',
          },
          { status: 403 },
        );
      }
    }

    log.info(
      { tenantId, locales, engine, force, userId: req.user.id },
      'Translation request received',
    );

    if (!tenantId || !locales || !engine) {
      log.warn(
        { tenantId, locales, engine },
        'Missing required fields in translate request',
      );
      return Response.json(
        { error: true, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    try {
      const job = await req.payload.jobs.queue({
        task: 'translate',
        input: {
          tenantId,
          locales,
          engine,
          force: force || false,
        },
        queue: 'translation',
      });

      log.info({ jobId: job.id, tenantId }, 'Translation job queued');

      return Response.json({
        success: true,
        jobId: job.id,
        message: 'Translation job queued successfully',
      });
    } catch (error) {
      log.error({ err: error, tenantId }, 'Error queuing translation job');
      return Response.json(
        {
          error: true,
          message:
            error instanceof Error ? error.message : 'Failed to queue job',
        },
        { status: 500 },
      );
    }
  },
};
