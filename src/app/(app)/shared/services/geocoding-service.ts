import { MAPBOX_API_KEY, MAPBOX_API_BASE_URL } from '../lib/constants';
import { withRedisCache } from '@/utilities/withRedisCache';
import { geoDataCacheService } from '@/cacheService';
import { fetchWrapper } from '../lib/fetchWrapper';
import { GeocodeResult, Coordinates, BBox } from '@/types/resource';

/**
 * Server-side geocoding with Redis caching
 * 
 * This function wraps the Mapbox Geocoding API and caches results in Redis.
 * It normalizes location strings for consistent cache keys and handles all
 * error cases gracefully by returning null.
 * 
 * @param location - Location string to geocode (e.g., "Minnesota", "Minneapolis")
 * @param locale - Language locale for results (default: 'en')
 * @returns Geocoded result or null if location not found or error occurs
 * 
 * @example
 * const result = await geocodeLocationCached('Minnesota', 'en');
 * if (result) {
 *   console.log(result.place_type); // ["region"]
 *   console.log(result.bbox); // [-97.238218, 43.499476, -89.498952, 49.384458]
 * }
 */
export async function geocodeLocationCached(
  location: string,
  locale: string = 'en'
): Promise<GeocodeResult | null> {
  // Normalize the location string for consistent cache keys
  const normalizedLocation = location.trim().toLowerCase();
  const cacheKey = `geocode:${normalizedLocation}:${locale}` as const;

  return await withRedisCache(
    cacheKey,
    async () => {
      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_API_KEY || '',
          country: 'US',
          autocomplete: 'false',  // We want exact match for server-side
          language: locale,
          limit: '1',  // Only need the first result
        });

        const res = await fetchWrapper<{ features?: any[] }>(
          `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?${params}`
        );

        const feature = res?.features?.[0];
        
        if (!feature) {
          return null;
        }

        return {
          type: 'coordinates',
          place_type: feature.place_type || [],
          bbox: (feature.bbox as BBox) || null,
          coordinates: (feature.geometry?.coordinates as Coordinates) || [0, 0],
          address: feature.place_name || location,
        };
      } catch (error) {
        console.error('Geocoding failed:', error);
        return null;
      }
    },
    geoDataCacheService
  );
}
