import { Redis } from 'ioredis';

let redisClient: Redis | null = null;
const redisClients: Map<number, Redis> = new Map();

export function cacheService(db: number = 0) {
  function getRedisClient(dbNumber: number): Redis | null {
    if (!process.env.CACHE_REDIS_URI) {
      console.warn('CACHE_REDIS_URI is not set. Caching is disabled.');
      return null;
    }

    if (dbNumber === 0) {
      if (!redisClient) {
        redisClient = new Redis(process.env.CACHE_REDIS_URI);
      }
      return redisClient;
    }

    if (!redisClients.has(dbNumber)) {
      const client = new Redis(process.env.CACHE_REDIS_URI);
      client.select(dbNumber);
      redisClients.set(dbNumber, client);
    }
    return redisClients.get(dbNumber) || null;
  }

  const client = getRedisClient(db);

  async function clear() {
    return client?.flushdb();
  }

  async function set(key: string, value: string, ttl?: number) {
    if (ttl !== undefined && ttl > 0) {
      return client?.setex(key, ttl, value);
    }
    return client?.set(key, value);
  }

  async function get(key: string) {
    if (!client) return null;
    return client.get(key);
  }

  async function del(key: string) {
    if (!client) return null;
    return client.del(key);
  }

  async function delPattern(pattern: string) {
    if (!client) return null;
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      return client.del(...keys);
    }

    return null;
  }

  return {
    clear,
    set,
    get,
    del,
    delPattern,
  };
}
