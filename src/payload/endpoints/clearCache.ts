import type { Endpoint } from 'payload';

const CACHE_SECRET = '7cbde38e-32d8-42e6-8000-9dcf4d57502b';

export const clearCache: Endpoint = {
  path: '/clear-cache',
  method: 'get',
  handler: async ({ query }) => {
    const secret = query.secret;
    if (secret !== CACHE_SECRET) {
      return Response.json({ status: 'unauthorized' }, { status: 401 });
    }

    try {
      const { cacheService } = await import('@/cacheService');
      await cacheService.clear();
      return Response.json({ status: 'cache cleared' }, { status: 200 });
    } catch (error) {
      return Response.json({ status: 'cache not cleared' }, { status: 200 });
    }
  },
};
