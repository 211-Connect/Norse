import { cacheService } from '@/cacheService';

type Seconds = number;
const ONE_HOUR: Seconds = 60 * 60;
const CACHE_TTL = ONE_HOUR;

type Domain = string;
type Locale = string;
type ResourceId = string;

export type RedisCacheKey =
  | `tenant:${Domain}`
  | `tenant_locale:${Domain}`
  | `resource_directory:${Domain}:${Locale}`
  | `resource:${ResourceId}:${Locale}`;

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
        console.error(
          `Failed to parse cached value for key ${key}:`,
          parseError,
        );
        await cacheService.del(key);
      }
    }
  } catch (error) {
    console.error(`Error reading from Redis cache for key ${key}:`, error);
  }

  const value = await fetchFunction();

  if (value != null) {
    try {
      await cacheService.set(key, JSON.stringify(value), CACHE_TTL);
    } catch (error) {
      console.error(`Error writing to Redis cache for key ${key}:`, error);
    }
  }

  return value;
};
