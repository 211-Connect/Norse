import { Redis } from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private isEnabled = Boolean(process.env.CACHE_REDIS_URI);
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionAttempted = false;

  constructor(private db: number = 0) {
    if (!this.isEnabled) {
      console.warn('CACHE_REDIS_URI is not set. Caching is disabled.');
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isEnabled) return;

    if (this.client?.status === 'ready') return;

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.connectionAttempted && !this.client) {
      console.warn(
        'Previous Redis connection attempt failed. Caching is disabled.',
      );
      return;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
      this.connectionAttempted = true;
    }
  }

  private async _connect(): Promise<void> {
    if (this.client) return;

    try {
      this.client = new Redis(process.env.CACHE_REDIS_URI!, {
        db: this.db,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        keepAlive: 30_000,
        connectTimeout: 10_000,
        commandTimeout: 5_000,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 5) {
            console.error(
              `Redis reconnection failed after ${times} attempts (DB ${this.db})`,
            );
            return null;
          }
          const delay = Math.pow(2, times) * 1000;
          console.log(
            `Redis reconnecting in ${delay}ms (attempt ${times}, DB ${this.db})`,
          );
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
        console.error(`Redis error (DB ${this.db}):`, err);
      });

      this.client.on('reconnecting', () => {
        console.warn(`Redis reconnecting (DB ${this.db})`);
      });

      await this.client.connect();
      console.log(`Redis connected and ready (DB ${this.db})`);
    } catch (error) {
      console.error(`Failed to connect to Redis (DB ${this.db}):`, error);
      if (this.client) {
        try {
          await this.client.quit();
        } catch {
          // Ignore cleanup errors
        }
      }
      this.client = null;
      this.isEnabled = false;
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) return;
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) {
        console.warn(`Cache set skipped (disabled): ${key}`);
        return;
      }
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
    try {
      await this.ensureConnection();
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) return;
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      await this.ensureConnection();
      if (!this.client) return 0;

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
    if (!this.isEnabled) {
      return false;
    }

    try {
      await this.ensureConnection();
      if (!this.client || this.client.status !== 'ready') {
        return false;
      }

      await this.client.ping();

      const testKey = `__health_check__:${this.db}:${process.pid}`;
      const expectedValue = 'ok';

      await this.client.setex(testKey, 10, expectedValue);
      const result = await this.client.get(testKey);
      await this.client.del(testKey);

      return result === expectedValue;
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

export const cacheService = new CacheService(0);
export const translationCacheService = new CacheService(1);
export const apiConfigCacheService = new CacheService(2);

let cleanupRegistered = false;
if (typeof process !== 'undefined' && !cleanupRegistered) {
  const cleanup = async () => {
    try {
      await Promise.all([
        cacheService.disconnect(),
        translationCacheService.disconnect(),
        apiConfigCacheService.disconnect(),
      ]);
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  };

  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
  cleanupRegistered = true;
}
