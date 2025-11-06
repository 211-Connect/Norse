import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

export function cacheService() {
  function getRedisClient(): Redis | null {
    if (!redisClient && process.env.CACHE_REDIS_URI) {
      redisClient = new Redis(process.env.CACHE_REDIS_URI);
    }
    return redisClient;
  }

  const client = getRedisClient();

  async function set(key: string, value: string) {
    return client?.set(key, value);
  }

  async function get(key: string) {
    return client?.get(key);
  }

  async function del(key: string) {
    return client?.del(key);
  }

  async function delPattern(pattern: string) {
    const keys = await client?.keys(pattern);
    if (keys && keys.length > 0) {
      return client?.del(...keys);
    }

    return null;
  }

  return {
    set,
    get,
    del,
    delPattern,
  };
}
