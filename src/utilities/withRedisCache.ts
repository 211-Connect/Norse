import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { createHash } from 'crypto';

const log = createLogger('withRedisCache');

type Seconds = number;
const FIFTEEN_MINUTES: Seconds = 15 * 60;
const CACHE_TTL = FIFTEEN_MINUTES;

type Domain = string;
type Locale = string;
type ResourceId = string;
type TenantId = string;
type Hash = string;

export type RedisCacheKey =
  | `tenant:${Domain}`
  | `tenant_locale:${Domain}`
  | `resource_directory:${Domain}:${Locale}`
  | `search_results:${TenantId}:${Locale}:${Hash}`
  | `resource:${ResourceId}:${Locale}`
  | `search_config:${TenantId}:${Locale}`
  | `orchestration_config:${TenantId}`;

export const withRedisCache = async <T>(
  key: RedisCacheKey,
  fetchFunction: () => Promise<T>,
): Promise<T | null> => {
  try {
    const cachedValue = await cacheService.get(key);
    if (cachedValue) {
      try {
        return JSON.parse(cachedValue);
      } catch (parseError) {
        log.error(
          { err: parseError, key },
          'Failed to parse cached value; evicting key',
        );
        await cacheService.del(key);
      }
    }
  } catch (error) {
    log.error({ err: error, key }, 'Error reading from Redis cache');
  }

  const value = await fetchFunction();

  if (value != null) {
    try {
      await cacheService.set(key, JSON.stringify(value), CACHE_TTL);
    } catch (error) {
      log.error({ err: error, key }, 'Error writing to Redis cache');
    }
  }

  return value;
};

/**
 * Stable SHA-256 hash of arbitrary data for use as a Redis cache key segment.
 * Sorts object keys before serializing so key insertion order doesn't affect the hash.
 */
export function stableHash(value: unknown): string {
  const stable = JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
  return createHash('sha256').update(stable).digest('hex');
}
