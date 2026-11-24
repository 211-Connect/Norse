import { createHash, randomUUID } from 'crypto';
import { LRUCache } from 'lru-cache';

import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { createSingleFlight } from '@/utilities/singleFlight';

const log = createLogger('withCache');

type Seconds = number;
export const ONE_MINUTE: Seconds = 60;
const FIFTEEN_MINUTES: Seconds = 15 * ONE_MINUTE;
export const ONE_HOUR: Seconds = 60 * ONE_MINUTE;
export const ONE_DAY: Seconds = 24 * ONE_HOUR;
export const ONE_MONTH: Seconds = 30 * ONE_DAY;

type Domain = string;
type Locale = string;
type TenantId = string;
type Hash = string;

export type CacheKey =
  | `tenant:${Domain | TenantId}`
  | `tenant_basic_config:${Domain}`
  | `tenant_api_key:${TenantId}`
  | `resource_directory:${Domain}:${Locale}`
  | `app_config:${Domain}:${Locale}`
  | `search_results:${TenantId}:${Locale}:${Hash}`
  | `search_pins:${TenantId}:${Locale}:${Hash}`
  | `forward_geocode:${Hash}`
  | `reverse_geocode:${Hash}`
  | `region_area:${string}`
  | `state_regions:${string}`
  | `search_config:${TenantId}:${Locale}`
  | `search_suggestions:${TenantId}:${Locale}:${Hash}`
  | `orchestration_config:${TenantId}`
  | `landing_version:${TenantId}`
  | `landing_page:${TenantId}:${Locale}:${Hash}`
  | `landing_sitemap:${TenantId}:${Hash}`;

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

/** The part of a key before the first `:`, e.g. `search_results`. */
export type CacheFeature = CacheKey extends `${infer Feature}:${string}`
  ? Feature
  : never;

type MemoryLimit = {
  /** Most entries kept. */
  maxEntries: number;
  /** Most bytes kept, counted as the length of the serialized value. */
  maxBytes: number;
  /** How long a value stays in memory; default `MEMORY_TTL_SECONDS`. */
  ttlSeconds?: Seconds;
};

const MB = 1024 * 1024;

/**
 * One in-memory LRU per feature, each with its own entry and size budget,
 * so a burst of one kind of value (e.g. search results) can never evict
 * another (e.g. tenant configs), and big values (area shapes) can't grow the
 * heap without bound. Worst case for all of them together: about 120 MB per
 * instance. A feature not listed gets `DEFAULT_MEMORY_LIMIT`.
 */
export const MEMORY_CACHE_LIMITS: Partial<Record<CacheFeature, MemoryLimit>> = {
  tenant: { maxEntries: 256, maxBytes: 16 * MB },
  tenant_basic_config: { maxEntries: 256, maxBytes: 4 * MB },
  resource_directory: { maxEntries: 256, maxBytes: 16 * MB },
  app_config: { maxEntries: 256, maxBytes: 16 * MB },
  search_config: { maxEntries: 256, maxBytes: 16 * MB },
  search_suggestions: { maxEntries: 1024, maxBytes: 64 * MB },
  // Only common searches (docs/caching.md), one page of results each. They
  // change only when the directory's data does, so they stay 15 minutes.
  search_results: {
    maxEntries: 4096,
    maxBytes: 128 * MB,
    ttlSeconds: FIFTEEN_MINUTES,
  },
  region_area: { maxEntries: 2048, maxBytes: 64 * MB },
  // Landing pages (docs/landing-pages.md, "Caching"): the version is read on
  // every page view, the resolved page and the page list are keyed by it.
  landing_version: { maxEntries: 256, maxBytes: 1 * MB },
  landing_page: { maxEntries: 4096, maxBytes: 32 * MB },
  landing_sitemap: { maxEntries: 64, maxBytes: 64 * MB },
};

const DEFAULT_MEMORY_LIMIT: MemoryLimit = { maxEntries: 500, maxBytes: 4 * MB };

/**
 * It's not possible to invalidate the memory cache on all instances, so by
 * default it keeps values for a short time to limit stale data.
 */
const MEMORY_TTL_SECONDS: Seconds = ONE_MINUTE;

const memoryCaches = new Map<string, LRUCache<CacheKey, string>>();

function createMemoryCache({
  maxEntries,
  maxBytes,
  ttlSeconds = MEMORY_TTL_SECONDS,
}: MemoryLimit): LRUCache<CacheKey, string> {
  return new LRUCache<CacheKey, string>({
    max: maxEntries,
    maxSize: maxBytes,
    // A single value may use at most a quarter of its feature's budget, so
    // one huge value can't flush everything else; a bigger one isn't kept.
    maxEntrySize: Math.max(1, Math.floor(maxBytes / 4)),
    sizeCalculation: (value) => Math.max(1, value.length),
    ttl: ttlSeconds * 1000,
    // Only reset the TTL on set, not on get/has, so a long-running instance
    // never keeps stale data indefinitely.
    noUpdateTTL: true,
  });
}

export function cacheFeatureOf(key: CacheKey): string {
  const separator = key.indexOf(':');
  return separator === -1 ? key : key.slice(0, separator);
}

/** The memory cache of the feature `key` belongs to, created on first use. */
function memoryCacheFor(key: CacheKey): LRUCache<CacheKey, string> {
  const feature = cacheFeatureOf(key);
  let cache = memoryCaches.get(feature);
  if (!cache) {
    cache = createMemoryCache(
      MEMORY_CACHE_LIMITS[feature as CacheFeature] ?? DEFAULT_MEMORY_LIMIT,
    );
    memoryCaches.set(feature, cache);
  }
  return cache;
}

/** Clears every feature's memory cache on this instance. */
export const clearMemoryCache = () => {
  for (const cache of memoryCaches.values()) cache.clear();
};

/** Entries and bytes per feature on this instance (tests, diagnostics). */
export function memoryCacheStats(): Record<
  string,
  { entries: number; bytes: number }
> {
  return Object.fromEntries(
    [...memoryCaches].map(([feature, cache]) => [
      feature,
      { entries: cache.size, bytes: cache.calculatedSize },
    ]),
  );
}

/**
 * Upper bound on how long concurrent misses wait on one shared fetch. Past
 * this a caller starts its own fetch, so a hung upstream call cannot block a
 * key for the life of the process.
 */
const IN_FLIGHT_MAX_AGE_MS = 30_000;

/** One upstream fetch per cache key per process, shared by concurrent misses. */
const fetchInFlight = createSingleFlight<CacheKey>(IN_FLIGHT_MAX_AGE_MS);

export const withCache = async <T>(
  key: CacheKey,
  fetchFunction: () => Promise<T>,
  config: CacheConfig = DEFAULT_CACHE_CONFIG,
  shouldCache: (value: T) => boolean = () => true,
  /**
   * Reports, exactly once per call, whether memory or Redis served the value
   * without calling `fetchFunction` (`true`) or the value had to be fetched
   * (`false`). Optional: existing callers behave unchanged.
   */
  onResult?: (hit: boolean) => void,
): Promise<T | null> => {
  const {
    redis = DEFAULT_CACHE_CONFIG.redis,
    memory = DEFAULT_CACHE_CONFIG.memory,
  } = config;

  // Telemetry must never break the cache.
  const report = (hit: boolean) => {
    try {
      onResult?.(hit);
    } catch {
      // ignore: a caller's observer is not allowed to fail the read
    }
  };

  if (memory) {
    try {
      const memCachedValue = memoryCacheFor(key).get(key);
      if (memCachedValue !== undefined) {
        try {
          const parsed = JSON.parse(memCachedValue);
          report(true);
          return parsed;
        } catch (parseError) {
          log.error(
            { err: parseError, key },
            'Failed to parse memory cached value; evicting key',
          );
          memoryCacheFor(key).delete(key);
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
              memoryCacheFor(key).set(key, cachedValue);
            } catch (error) {
              log.error({ err: error, key }, 'Error writing to memory cache');
            }
          }
          report(true);
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

  // Concurrent misses for the same key share one fetch. The cache writes
  // happen inside it, so a caller arriving after it settles hits the cache.
  const { promise, shared } = fetchInFlight(key, async () => {
    const value = await fetchFunction();
    if (value == null) return { value, serialized: null };

    // Serialized before any caller sees `value`, so joiners get a clean copy
    // even if the first caller mutates its result.
    const serialized = JSON.stringify(value);

    if (shouldCache(value)) {
      if (redis) {
        try {
          await cacheService.set(
            key,
            serialized,
            config.ttl ?? FIFTEEN_MINUTES,
          );
        } catch (error) {
          log.error({ err: error, key }, 'Error writing to Redis cache');
        }
      }

      if (memory) {
        try {
          memoryCacheFor(key).set(key, serialized);
        } catch (error) {
          log.error({ err: error, key }, 'Error writing to memory cache');
        }
      }
    }

    return { value, serialized };
  });

  let result: Awaited<typeof promise>;
  try {
    result = await promise;
  } catch (error) {
    // The origin failed: still one report per call, then let the failure
    // propagate. `false` = the value was not served from cache.
    report(false);
    throw error;
  }
  report(false);
  // The caller that started the fetch keeps the original; joiners get their
  // own copy, like a cache hit.
  if (!shared || result.serialized === null) return result.value;
  return JSON.parse(result.serialized) as T;
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
