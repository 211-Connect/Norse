import { createHash, randomUUID } from 'crypto';
import { LRUCache } from 'lru-cache';

import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';

const log = createLogger('withCache');

type Seconds = number;
const FIFTEEN_MINUTES: Seconds = 15 * 60;
export const ONE_MONTH: Seconds = 30 * 24 * 60 * 60;
export const ONE_HOUR: Seconds = 60 * 60;
const ONE_MINUTE: Seconds = 60;
const MAX_CACHE_ENTRIES = 1000;

type Domain = string;
type Locale = string;
type ResourceId = string;
type TenantId = string;
type Hash = string;

export type CacheKey =
  | `tenant:${Domain | TenantId}`
  | `tenant_basic_config:${Domain}`
  | `resource_directory:${Domain}:${Locale}`
  | `search_results:${TenantId}:${Locale}:${Hash}`
  | `reverse_geocode:${Hash}`
  | `resource:${ResourceId}:${Locale}`
  | `resource_batch:${TenantId | 'public'}:${Locale}:${Hash}`
  | `search_config:${TenantId}:${Locale}`
  | `orchestration_config:${TenantId}`;

export type CacheConfig = {
  redis?: boolean;
  memory?: boolean;
  ttl?: Seconds;
};

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  redis: true,
  memory: false,
  ttl: FIFTEEN_MINUTES,
};

const memoryCache = new LRUCache<CacheKey, string>({
  max: MAX_CACHE_ENTRIES,
  ttl: ONE_MINUTE * 1000, // it's not possible to invalidate memory cache for all instances so use shorter TTL to limit stale data
  noUpdateTTL: true, // only reset TTL on set, not on get/has, to avoid keeping stale data indefinitely in a long-running instance
});

export const clearMemoryCache = () => {
  memoryCache.clear();
};

export const withCache = async <T>(
  key: CacheKey,
  fetchFunction: () => Promise<T>,
  config: CacheConfig = DEFAULT_CACHE_CONFIG,
  shouldCache: (value: T) => boolean = () => true,
): Promise<T | null> => {
  const {
    redis = DEFAULT_CACHE_CONFIG.redis,
    memory = DEFAULT_CACHE_CONFIG.memory,
  } = config;

  if (memory) {
    try {
      const memCachedValue = memoryCache.get(key);
      if (memCachedValue !== undefined) {
        try {
          return JSON.parse(memCachedValue);
        } catch (parseError) {
          log.error(
            { err: parseError, key },
            'Failed to parse memory cached value; evicting key',
          );
          memoryCache.delete(key);
        }
      }
    } catch (error) {
      log.error({ err: error, key }, 'Error reading from memory cache');
    }
  }

  if (redis) {
    try {
      const cachedValue = await cacheService.get(key);
      if (cachedValue) {
        try {
          const parsed = JSON.parse(cachedValue);
          if (memory) {
            try {
              memoryCache.set(key, cachedValue);
            } catch (error) {
              log.error({ err: error, key }, 'Error writing to memory cache');
            }
          }
          return parsed;
        } catch (parseError) {
          log.error(
            { err: parseError, key },
            'Failed to parse Redis cached value; evicting key',
          );
          await cacheService.del(key);
        }
      }
    } catch (error) {
      log.error({ err: error, key }, 'Error reading from Redis cache');
    }
  }

  const value = await fetchFunction();

  if (value != null && shouldCache(value)) {
    const serialized = JSON.stringify(value);

    if (redis) {
      try {
        await cacheService.set(key, serialized, config.ttl ?? FIFTEEN_MINUTES);
      } catch (error) {
        log.error({ err: error, key }, 'Error writing to Redis cache');
      }
    }

    if (memory) {
      try {
        memoryCache.set(key, serialized);
      } catch (error) {
        log.error({ err: error, key }, 'Error writing to memory cache');
      }
    }
  }

  return value;
};

/**
 * Stable SHA-256 hash of arbitrary data for use as a Redis cache key segment.
 * Sorts object keys before serializing so key insertion order doesn't affect the hash.
 */
export function stableHash(value: unknown): string {
  try {
    const stable =
      JSON.stringify(value, (_, v) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ) ?? 'null';
    return createHash('sha256').update(stable).digest('hex');
  } catch (error) {
    log.error({ err: error, value }, 'Error hashing value for cache key');
    return randomUUID();
  }
}

// Export memory cache instance for manual invalidation if needed
export { memoryCache };
