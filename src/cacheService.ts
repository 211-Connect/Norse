import { Redis } from 'ioredis';

import { createLogger } from '@/lib/logger';

const log = createLogger('cache');

/** After a failed first connect, wait this long before trying again. */
const CONNECT_RETRY_COOLDOWN_MS = 10_000;
/** Cap on ioredis's reconnect backoff once a connection drops. */
const MAX_RECONNECT_DELAY_MS = 5_000;

class CacheService {
  private client: Redis | null = null;
  private readonly isEnabled = Boolean(process.env.CACHE_REDIS_URI);
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private lastConnectFailureAt = 0;
  /** ioredis reconnect attempts since the connection dropped; 0 when up. */
  private reconnectAttempts = 0;

  constructor(private db: number = 0) {}

  private async ensureConnection(): Promise<void> {
    if (!this.isEnabled) {
      log.warn('CACHE_REDIS_URI is not set; caching is disabled');
      return;
    }

    if (this.client?.status === 'ready') return;

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // An existing client that is not ready is reconnecting on its own
    // (retryStrategy never gives up); with enableOfflineQueue off, commands
    // fail fast until it is back, and callers fall back to the source.
    if (this.client) return;

    // The first connect failed recently: skip Redis for now instead of
    // paying connectTimeout on every call, but try again after a cooldown
    // rather than staying disabled for the life of the process.
    if (Date.now() - this.lastConnectFailureAt < CONNECT_RETRY_COOLDOWN_MS) {
      return;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
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
          // 0.25s, 0.5s, 0.75s, ... capped at 5s, and never give up:
          // returning null ends the client for good, which used to turn
          // the cache off until the process restarted.
          const delay = Math.min(times * 250, MAX_RECONNECT_DELAY_MS);
          this.reconnectAttempts = times;
          if (this.shouldLogReconnect()) {
            log.warn(
              { db: this.db, attempt: times, delayMs: delay },
              'Redis reconnecting',
            );
          }
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
        if (this.shouldLogReconnect()) {
          log.error({ err, db: this.db }, 'Redis error');
        }
      });

      this.client.on('ready', () => {
        if (this.reconnectAttempts === 0) return;
        log.info(
          { db: this.db, attempts: this.reconnectAttempts },
          'Redis reconnected',
        );
        this.reconnectAttempts = 0;
      });

      await this.client.connect();
      log.info({ db: this.db }, 'Redis connected and ready');
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Failed to connect to Redis');
      // disconnect(), not quit(): quit() does not stop a client that is
      // already retrying, which would then reconnect in the background as
      // an orphan connection.
      this.client?.disconnect();
      this.client = null;
      this.reconnectAttempts = 0;
      this.lastConnectFailureAt = Date.now();
      throw error;
    }
  }

  /**
   * While Redis is down, ioredis retries every few seconds forever; log the
   * first attempts and then about once a minute, not every attempt.
   */
  private shouldLogReconnect(): boolean {
    return this.reconnectAttempts <= 2 || this.reconnectAttempts % 12 === 0;
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
    try {
      await this.ensureConnection();
      if (!this.client) {
        log.warn({ key }, 'Cache set skipped; Redis disabled');
        return;
      }
      if (ttl !== undefined && ttl > 0) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Redis set error');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Redis get error');
      return null;
    }
  }

  /**
   * Atomically increments a counter that expires `ttl` seconds after its
   * first increment. Null when Redis is unavailable.
   */
  async incrementWithTtl(key: string, ttl: number): Promise<number | null> {
    try {
      await this.ensureConnection();
      if (!this.client) return null;
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, ttl);
      }
      return count;
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Redis incr error');
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.client) return;
      await this.client.del(key);
    } catch (error) {
      log.error({ err: error, db: this.db }, 'Redis del error');
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
