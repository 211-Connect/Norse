import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { geocodeLocationCached } from '@/app/(app)/shared/services/geocoding-service';
import { withRedisCache } from '@/utilities/withRedisCache';
import axios from 'axios';
import { GeocodeResult, Coordinates, BBox } from '@/types/resource';

// Mock the Redis cache
jest.mock('@/utilities/withRedisCache', () => ({
  withRedisCache: jest.fn(),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockedWithRedisCache = withRedisCache as jest.MockedFunction<typeof withRedisCache>;

describe('geocoding-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('geocodeLocationCached', () => {
    const mockMapboxResponse = {
      data: {
        features: [
          {
            place_type: ['region'],
            bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
            geometry: {
              coordinates: [-94.199117, 46.343406],
            },
            place_name: 'Minnesota, United States',
          },
        ],
      },
    };

    describe('Cache Hit Scenario', () => {
      it('should return cached data when cache hit occurs', async () => {
        const expectedResult: GeocodeResult = {
          type: 'coordinates',
          place_type: ['region'],
          bbox: [-97.238218, 43.499476, -89.498952, 49.384458] as BBox,
          coordinates: [-94.199117, 46.343406] as Coordinates,
          address: 'Minnesota, United States',
        };

        // Mock cache hit
        mockedWithRedisCache.mockResolvedValueOnce(expectedResult);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toEqual(expectedResult);
        expect(mockedWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:en',
          expect.any(Function)
        );
        // Should NOT call Mapbox API on cache hit
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });

      it('should use normalized cache key (lowercase, trimmed)', async () => {
        mockedWithRedisCache.mockResolvedValueOnce(null);

        await geocodeLocationCached('  MinNeSoTa  ', 'en');

        expect(mockedWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:en',
          expect.any(Function)
        );
      });
    });

    describe('Cache Miss Scenario', () => {
      it('should call Mapbox API and return transformed data on cache miss', async () => {
        // Mock cache miss - withRedisCache will execute the function
        mockedWithRedisCache.mockImplementation(async (key, fn) => {
          return await fn();
        });

        mockedAxios.get.mockResolvedValueOnce(mockMapboxResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toEqual({
          type: 'coordinates',
          place_type: ['region'],
          bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
          coordinates: [-94.199117, 46.343406],
          address: 'Minnesota, United States',
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('mapbox.com/geocoding'),
          expect.objectContaining({
            params: expect.objectContaining({
              access_token: expect.any(String),
              country: 'US',
              autocomplete: false,
              language: 'en',
              limit: 1,
            }),
          })
        );
      });

      it('should handle cache miss for city (place type)', async () => {
        const cityResponse = {
          data: {
            features: [
              {
                place_type: ['place'],
                bbox: null,
                geometry: {
                  coordinates: [-93.2650, 44.9778],
                },
                place_name: 'Minneapolis, Minnesota, United States',
              },
            ],
          },
        };

        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce(cityResponse);

        const result = await geocodeLocationCached('Minneapolis', 'en');

        expect(result).toEqual({
          type: 'coordinates',
          place_type: ['place'],
          bbox: null,
          coordinates: [-93.2650, 44.9778],
          address: 'Minneapolis, Minnesota, United States',
        });
      });
    });

    describe('Error Handling', () => {
      it('should return null when Mapbox API returns no features', async () => {
        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce({ data: { features: [] } });

        const result = await geocodeLocationCached('InvalidLocation', 'en');

        expect(result).toBeNull();
      });

      it('should return null when Mapbox API fails', async () => {
        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toBeNull();
      });

      it('should handle malformed Mapbox response gracefully', async () => {
        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce({ data: {} });

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toBeNull();
      });
    });

    describe('Data Transformation', () => {
      it('should handle missing bbox (defaults to null)', async () => {
        const noBboxResponse = {
          data: {
            features: [
              {
                place_type: ['address'],
                geometry: { coordinates: [-93.2650, 44.9778] },
                place_name: '123 Main St',
              },
            ],
          },
        };

        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce(noBboxResponse);

        const result = await geocodeLocationCached('123 Main St', 'en');

        expect(result?.bbox).toBeNull();
      });

      it('should handle missing coordinates (defaults to [0, 0])', async () => {
        const noCoordinatesResponse = {
          data: {
            features: [
              {
                place_type: ['region'],
                bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
                place_name: 'Minnesota',
              },
            ],
          },
        };

        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce(noCoordinatesResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result?.coordinates).toEqual([0, 0]);
      });

      it('should preserve place_type as array', async () => {
        const multiTypeResponse = {
          data: {
            features: [
              {
                place_type: ['region', 'administrative'],
                geometry: { coordinates: [-94.199117, 46.343406] },
                place_name: 'Minnesota',
              },
            ],
          },
        };

        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce(multiTypeResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result?.place_type).toEqual(['region', 'administrative']);
      });
    });

    describe('Locale Support', () => {
      it('should pass locale to Mapbox API', async () => {
        mockedWithRedisCache.mockImplementation(async (key, fn) => await fn());
        mockedAxios.get.mockResolvedValueOnce(mockMapboxResponse);

        await geocodeLocationCached('Minnesota', 'es');

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            params: expect.objectContaining({
              language: 'es',
            }),
          })
        );
      });

      it('should create separate cache keys for different locales', async () => {
        mockedWithRedisCache.mockResolvedValueOnce(null);

        await geocodeLocationCached('Minnesota', 'es');

        expect(mockedWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:es',
          expect.any(Function)
        );
      });
    });
  });
});
