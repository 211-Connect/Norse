import { Redis } from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private readonly isEnabled = Boolean(process.env.CACHE_REDIS_URI);

  constructor(private db: number = 0) {
    if (!this.isEnabled) {
      console.warn('CACHE_REDIS_URI is not set. Caching is disabled.');
      return;
    }

    try {
      this.client = new Redis(process.env.CACHE_REDIS_URI!, {
        db,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 10_000,
        commandTimeout: 5_000,
        retryStrategy: (times) => {
          if (times > 5) {
            console.error(`Redis reconnection failed after ${times} attempts`);
            return null; // Stop retrying
          }
          const delay = Math.pow(2, times) * 1000;
          console.log(`Redis reconnecting in ${delay}ms (attempt ${times})`);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNRESET'];
          return targetErrors.some((targetError) =>
            err.message.includes(targetError),
          );
        },
      });

      this.client.on('error', (err) => {
        console.error(`Redis error (DB ${db}):`, err);
      });

      this.client.on('connect', () => {
        console.log(`Redis connected (DB ${db})`);
      });

      this.client.on('ready', () => {
        console.log(`Redis ready (DB ${db})`);
      });

      this.client.on('reconnecting', () => {
        console.warn(`Redis reconnecting (DB ${db})`);
      });
    } catch (error) {
      console.error(`Failed to initialize Redis client (DB ${db}):`, error);
      this.client = null;
      this.isEnabled = false;
    }
  }

  async clear(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      console.warn(`Cache set skipped (disabled): ${key}`);
      return;
    }
    try {
      if (ttl !== undefined && ttl > 0) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.client) return 0;

    try {
      let cursor = '0';
      let deletedCount = 0;
      let iterations = 0;
      const maxIterations = 1000; // Prevent infinite loops

      // Use SCAN instead of KEYS for production safety
      do {
        if (iterations++ > maxIterations) {
          console.warn(
            `delPattern exceeded max iterations for pattern: ${pattern}`,
          );
          break;
        }

        const [newCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = newCursor;

        if (keys.length > 0) {
          const result = await this.client.del(...keys);
          deletedCount += result;
        }
      } while (cursor !== '0');

      return deletedCount;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled || this.client === null) {
      return false;
    }

    if (this.client.status !== 'ready') {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }
}

// Singleton instances for commonly used databases
export const cacheService = new CacheService(0);
export const translationCacheService = new CacheService(1);

let cleanupRegistered = false;
if (typeof process !== 'undefined' && !cleanupRegistered) {
  const cleanup = async () => {
    try {
      await Promise.all([
        cacheService.disconnect(),
        translationCacheService.disconnect(),
      ]);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  };

  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
  cleanupRegistered = true;
}
