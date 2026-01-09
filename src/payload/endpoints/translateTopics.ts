import { Endpoint } from 'payload';

export const translateTopicsEndpoint: Endpoint = {
  path: '/translate-topics',
  method: 'post',
  handler: async (req) => {
    const body = await req.json?.();
    const { tenantId, locales, engine, force } = body || {};

    console.log('[translateTopicsEndpoint] Request received:', {
      tenantId,
      locales,
      engine,
      force,
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
