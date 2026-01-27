import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import type { GeocodeResult, Coordinates, BBox } from '@/types/resource';

describe('geocoding-service', () => {
  let geocodeLocationCached: any;
  let mockWithRedisCache: jest.Mock<any>;
  let mockFetchWrapper: jest.Mock<any>;
  const mockCacheService = { disconnect: jest.fn() };
  const mockGeoDataCacheService = { disconnect: jest.fn(), ...{ name: 'mockGeoDataCacheService' } };
  const mockTranslationCacheService = { disconnect: jest.fn() };

  beforeEach(async () => {
    jest.resetModules();

    mockWithRedisCache = jest.fn((key: any, fn: any) => fn());
    mockFetchWrapper = jest.fn();

    jest.doMock('@/utilities/withRedisCache', () => ({
      __esModule: true,
      withRedisCache: mockWithRedisCache,
    }));

    jest.doMock('@/app/(app)/shared/lib/fetchWrapper', () => ({
      __esModule: true,
      fetchWrapper: mockFetchWrapper,
    }));

    jest.doMock('@/cacheService', () => ({
      __esModule: true,
      cacheService: mockCacheService,
      geoDataCacheService: mockGeoDataCacheService,
      translationCacheService: mockTranslationCacheService,
    }));

    const serviceModule = await import('@/app/(app)/shared/services/geocoding-service');
    geocodeLocationCached = serviceModule.geocodeLocationCached;
  });

  const mockMapboxResponse = {
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
  };

  describe('geocodeLocationCached', () => {
    describe('Cache Hit Scenario', () => {
      it('should return cached data when cache hit occurs', async () => {
        const expectedResult: GeocodeResult = {
          type: 'coordinates',
          place_type: ['region'],
          bbox: [-97.238218, 43.499476, -89.498952, 49.384458] as BBox,
          coordinates: [-94.199117, 46.343406] as Coordinates,
          address: 'Minnesota, United States',
        };

        mockWithRedisCache.mockResolvedValueOnce(expectedResult);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toEqual(expectedResult);
        expect(mockWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:en',
          expect.any(Function),
          mockGeoDataCacheService
        );
        expect(mockFetchWrapper).not.toHaveBeenCalled();
      });

      it('should use normalized cache key (lowercase, trimmed)', async () => {
        mockWithRedisCache.mockResolvedValueOnce(null);

        await geocodeLocationCached('  MinNeSoTa  ', 'en');

        expect(mockWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:en',
          expect.any(Function),
          mockGeoDataCacheService
        );
      });
    });

    describe('Cache Miss Scenario', () => {
      it('should call Mapbox API and return transformed data on cache miss', async () => {
        // Mock cache miss (implementation is already set in beforeEach to call fn)
        
        mockFetchWrapper.mockResolvedValueOnce(mockMapboxResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toEqual({
          type: 'coordinates',
          place_type: ['region'],
          bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
          coordinates: [-94.199117, 46.343406],
          address: 'Minnesota, United States',
        });

        expect(mockFetchWrapper).toHaveBeenCalledWith(
          expect.stringContaining('mapbox.com/geocoding'),
        );
      });

      it('should handle cache miss for city (place type)', async () => {
        const cityResponse = {
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
        };

        mockFetchWrapper.mockResolvedValueOnce(cityResponse);

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
        mockFetchWrapper.mockResolvedValueOnce({ features: [] });

        const result = await geocodeLocationCached('InvalidLocation', 'en');

        expect(result).toBeNull();
      });

      it('should return null when Mapbox API fails', async () => {
        mockFetchWrapper.mockRejectedValueOnce(new Error('API Error'));

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toBeNull();
      });

      it('should handle malformed Mapbox response gracefully', async () => {
        mockFetchWrapper.mockResolvedValueOnce({});

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result).toBeNull();
      });
    });

    describe('Data Transformation', () => {
      it('should handle missing bbox (defaults to null)', async () => {
        const noBboxResponse = {
          features: [
            {
              place_type: ['address'],
              geometry: { coordinates: [-93.2650, 44.9778] },
              place_name: '123 Main St',
            },
          ],
        };

        mockFetchWrapper.mockResolvedValueOnce(noBboxResponse);

        const result = await geocodeLocationCached('123 Main St', 'en');

        expect(result?.bbox).toBeNull();
      });

      it('should handle missing coordinates (defaults to [0, 0])', async () => {
        const noCoordinatesResponse = {
          features: [
            {
              place_type: ['region'],
              bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
              place_name: 'Minnesota',
            },
          ],
        };

        mockFetchWrapper.mockResolvedValueOnce(noCoordinatesResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result?.coordinates).toEqual([0, 0]);
      });

      it('should preserve place_type as array', async () => {
        const multiTypeResponse = {
          features: [
            {
              place_type: ['region', 'administrative'],
              geometry: { coordinates: [-94.199117, 46.343406] },
              place_name: 'Minnesota',
            },
          ],
        };

        mockFetchWrapper.mockResolvedValueOnce(multiTypeResponse);

        const result = await geocodeLocationCached('Minnesota', 'en');

        expect(result?.place_type).toEqual(['region', 'administrative']);
      });
    });

    describe('Locale Support', () => {
      it('should pass locale to Mapbox API', async () => {
        mockFetchWrapper.mockResolvedValueOnce(mockMapboxResponse);

        await geocodeLocationCached('Minnesota', 'es');

        expect(mockFetchWrapper).toHaveBeenCalledWith(
           expect.stringContaining('language=es')
        );
      });

      it('should create separate cache keys for different locales', async () => {
        mockWithRedisCache.mockResolvedValueOnce(null);

        await geocodeLocationCached('Minnesota', 'es');

        expect(mockWithRedisCache).toHaveBeenCalledWith(
          'geocode:minnesota:es',
          expect.any(Function),
          mockGeoDataCacheService
        );
      });
    });
  });
});
