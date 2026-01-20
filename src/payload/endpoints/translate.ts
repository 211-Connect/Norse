import { Endpoint } from 'payload';
import {
  isSuperAdmin,
  isSupport,
  isTenant,
} from '../collections/Users/access/roles';

export const translateEndpoint: Endpoint = {
  path: '/translate',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      console.error('[translateEndpoint] Unauthorized: No user');
      return Response.json(
        { error: true, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const hasPermission =
      isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
    if (!hasPermission) {
      console.error('[translateEndpoint] Forbidden: User lacks required role', {
        userId: req.user.id,
        roles: req.user.roles,
      });
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
        console.error(
          '[translateEndpoint] Forbidden: Tenant does not own this resource directory',
          {
            userId: req.user.id,
            requestedTenantId: tenantId,
            userTenantIds,
          },
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

    console.log('[translateEndpoint] Request received:', {
      tenantId,
      locales,
      engine,
      force,
      userId: req.user.id,
      userRoles: req.user.roles,
    });

    if (!tenantId || !locales || !engine) {
      console.error('[translateEndpoint] Missing required fields. Received:', {
        tenantId,
        locales,
        engine,
      });
      return Response.json(
        { error: true, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    try {
      console.log('[translateEndpoint] Queueing job...');
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

      console.log('[translateEndpoint] Job queued successfully:', {
        jobId: job.id,
        queue: 'translation',
      });

      return Response.json({
        success: true,
        jobId: job.id,
        message: 'Translation job queued successfully',
      });
    } catch (error) {
      console.error('Error queuing translation job:', error);
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
