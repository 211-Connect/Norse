import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';

const log = createLogger('withRedisCache');

type Seconds = number;
const ONE_HOUR: Seconds = 60 * 60;
const CACHE_TTL = ONE_HOUR;

type Domain = string;
type Locale = string;
type ResourceId = string;
type TenantId = string;

export type RedisCacheKey =
  | `tenant:${Domain}`
  | `tenant_locale:${Domain}`
  | `resource_directory:${Domain}:${Locale}`
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
