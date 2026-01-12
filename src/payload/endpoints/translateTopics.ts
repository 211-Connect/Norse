import { Endpoint } from 'payload';
import {
  isSuperAdmin,
  isSupport,
  isTenant,
} from '../collections/Users/access/roles';

export const translateTopicsEndpoint: Endpoint = {
  path: '/translate-topics',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      console.error('[translateTopicsEndpoint] Unauthorized: No user');
      return Response.json(
        { error: true, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const hasPermission =
      isSuperAdmin(req.user) || isSupport(req.user) || isTenant(req.user);
    if (!hasPermission) {
      console.error(
        '[translateTopicsEndpoint] Forbidden: User lacks required role',
        {
          userId: req.user.id,
          roles: req.user.roles,
        },
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
        req.user.tenants?.map((t) => (typeof t === 'string' ? t : t.id)) || [];

      if (!userTenantIds.includes(tenantId)) {
        console.error(
          '[translateTopicsEndpoint] Forbidden: Tenant does not own this resource directory',
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

    console.log('[translateTopicsEndpoint] Request received:', {
      tenantId,
      locales,
      engine,
      force,
      userId: req.user.id,
      userRoles: req.user.roles,
    });

    if (!tenantId || !locales || !engine) {
      console.error(
        '[translateTopicsEndpoint] Missing required fields. Received:',
        {
          tenantId,
          locales,
          engine,
        },
      );
      return Response.json(
        { error: true, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    try {
      console.log('[translateTopicsEndpoint] Queueing job...');
      const job = await req.payload.jobs.queue({
        task: 'translateTopics',
        input: {
          tenantId,
          locales,
          engine,
          force: force || false,
        },
        queue: 'translation',
      });

      console.log('[translateTopicsEndpoint] Job queued successfully:', {
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
