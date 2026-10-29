import { Redis } from 'ioredis';

import { createLogger } from '@/lib/logger';
import { createCircuitBreaker } from '@/utilities/circuitBreaker';

const log = createLogger('cache');

/** Consecutive failed Redis commands that open the circuit. */
const REDIS_CIRCUIT_FAILURE_THRESHOLD = 3;
/**
 * How long Redis is skipped once the circuit opens. Callers fall back to
 * the source (a miss, or a skipped write) instead of each waiting out
 * `commandTimeout` while Redis is down or slow.
 */
const REDIS_CIRCUIT_OPEN_MS = 30_000;

class CacheService {
  private client: Redis | null = null;
  private isEnabled = Boolean(process.env.CACHE_REDIS_URI);
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionAttempted = false;
  private breaker = createCircuitBreaker({
    failureThreshold: REDIS_CIRCUIT_FAILURE_THRESHOLD,
    openMs: REDIS_CIRCUIT_OPEN_MS,
  });

  constructor(private db: number = 0) {}

  /**
   * Runs one cache operation through the circuit breaker. Redis is a cache,
   * never a dependency: any failure, or an open circuit, resolves to
   * `fallback` so the caller fetches from the source.
   */
  private async run<T>(
    operation: string,
    fallback: T,
    fn: (client: Redis) => Promise<T>,
  ): Promise<T> {
    if (!this.breaker.allow()) return fallback;
    try {
      await this.ensureConnection();
      // Disabled, or the connection failed earlier: not a Redis outage the
      // breaker should count.
      if (!this.client) return fallback;
      const result = await fn(this.client);
      const closed = this.breaker.recordSuccess();
      if (closed) {
        log.info({ db: this.db, ...closed }, 'Redis circuit closed');
      }
      return result;
    } catch (error) {
      log.warn({ err: error, db: this.db }, `Redis ${operation} error`);
      const opened = this.breaker.recordFailure();
      if (opened) {
        log.warn(
          {
            db: this.db,
            reopened: opened === 'reopened',
            openForMs: REDIS_CIRCUIT_OPEN_MS,
          },
          'Redis circuit open; skipping Redis',
        );
      }
      return fallback;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isEnabled) {
      log.warn('CACHE_REDIS_URI is not set; caching is disabled');
      return;
    }

    if (this.client?.status === 'ready') return;

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.connectionAttempted && !this.client) {
      log.warn(
        { db: this.db },
        'Previous Redis connection attempt failed; caching is disabled',
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
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        keepAlive: 30_000,
        connectTimeout: 3_000,
        commandTimeout: 1_000,
        lazyConnect: true,
        retryStrategy: (times) => {
          // 0.25s → 0.5s → 0.75s → 1s, then give up (~2.5s total)
          if (times > 4) {
            log.error(
              { db: this.db, attempts: times },
              'Redis reconnection failed; giving up',
            );
            return null;
          }
          const delay = times * 250;
          log.debug(
            { db: this.db, attempt: times, delayMs: delay },
            'Redis will reconnect',
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
        log.error({ err, db: this.db }, 'Redis error');
      });

      this.client.on('reconnecting', () => {
        log.warn({ db: this.db }, 'Redis reconnecting');
      });

      await this.client.connect();
      log.info({ db: this.db }, 'Redis connected and ready');
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Failed to connect to Redis');
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
      log.error({ err: error, db: this.db }, 'Redis clear error');
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.run('set', undefined, async (client) => {
      if (ttl !== undefined && ttl > 0) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    });
  }

  async get(key: string): Promise<string | null> {
    return this.run('get', null, (client) => client.get(key));
  }

  /**
   * Atomically increments a counter that expires `ttl` seconds after its
   * first increment. Null when Redis is unavailable.
   */
  async incrementWithTtl(key: string, ttl: number): Promise<number | null> {
    return this.run('incr', null, async (client) => {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttl);
      }
      return count;
    });
  }

  async del(key: string): Promise<void> {
    await this.run('del', undefined, async (client) => {
      await client.del(key);
    });
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
          log.warn(
            { pattern, maxIterations },
            'delPattern exceeded max iterations',
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
      log.error({ err: error, db: this.db }, 'Redis delPattern error');
      return 0;
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
      log.error({ err: error, db: this.db }, 'Redis health check failed');
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
      log.error({ err: error }, 'Error during cache cleanup');
    }
  };

  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
  // eslint-disable-next-line no-useless-assignment
  cleanupRegistered = true;
}
