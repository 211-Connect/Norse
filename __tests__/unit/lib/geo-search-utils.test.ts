import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  isAdvancedGeoEnabled,
  shouldUseBoundarySearch,
  bboxToPolygon,
  buildSearchRequest,
  type SearchRequestParams,
} from '@/app/(app)/shared/lib/search-utils';

describe('geo-search-utils', () => {
  // Store original env value
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;
  });

  afterEach(() => {
    // Restore original env value
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;
    } else {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = originalEnv;
    }
  });

  describe('isAdvancedGeoEnabled', () => {
    it('should return true when feature flag is "true"', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      expect(isAdvancedGeoEnabled()).toBe(true);
    });

    it('should return false when feature flag is "false"', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'false';
      expect(isAdvancedGeoEnabled()).toBe(false);
    });

    it('should return false when feature flag is undefined', () => {
      delete process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;
      expect(isAdvancedGeoEnabled()).toBe(false);
    });

    it('should return false when feature flag is any other value', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = '1';
      expect(isAdvancedGeoEnabled()).toBe(false);
    });
  });

  describe('shouldUseBoundarySearch', () => {
    it('should return true for region with bbox when flag is enabled', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        ['region'],
        [-97.238218, 43.499476, -89.498952, 49.384458],
      );
      expect(result).toBe(true);
    });

    it('should return true for country with bbox when flag is enabled', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        ['country'],
        [-125.0, 24.0, -66.0, 49.0],
      );
      expect(result).toBe(true);
    });

    it('should return false for place (city) even with bbox', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        ['place'],
        [-122.4194, 47.6062, -122.3321, 47.6762],
      );
      expect(result).toBe(false);
    });

    it('should return false for district even with bbox', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        ['district'],
        [-122.5, 47.5, -122.0, 48.0],
      );
      expect(result).toBe(false);
    });

    it('should return false for region without bbox', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(['region'], null);
      expect(result).toBe(false);
    });

    it('should return false for region with invalid bbox (not 4 numbers)', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(['region'], [-97.2, 43.5, -89.5] as any);
      expect(result).toBe(false);
    });

    it('should return false when place_type is null', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        null,
        [-97.238218, 43.499476, -89.498952, 49.384458],
      );
      expect(result).toBe(false);
    });

    it('should return false when place_type is empty array', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        [],
        [-97.238218, 43.499476, -89.498952, 49.384458],
      );
      expect(result).toBe(false);
    });

    it('should return false when feature flag is disabled (even with region and bbox)', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'false';
      const result = shouldUseBoundarySearch(
        ['region'],
        [-97.238218, 43.499476, -89.498952, 49.384458],
      );
      expect(result).toBe(false);
    });

    it('should return true for multiple place types including region', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
      const result = shouldUseBoundarySearch(
        ['place', 'region'],
        [-97.238218, 43.499476, -89.498952, 49.384458],
      );
      expect(result).toBe(true);
    });
  });

  describe('bboxToPolygon', () => {
    it('should convert bbox to valid GeoJSON Polygon', () => {
      const bbox: [number, number, number, number] = [
        -97.238218, 43.499476, -89.498952, 49.384458,
      ];
      const polygon = bboxToPolygon(bbox);

      expect(polygon.type).toBe('Polygon');
      expect(polygon.coordinates).toBeDefined();
      expect(Array.isArray(polygon.coordinates)).toBe(true);
    });

    it('should create a closed ring (first point equals last point)', () => {
      const bbox: [number, number, number, number] = [
        -97.238218, 43.499476, -89.498952, 49.384458,
      ];
      const polygon = bboxToPolygon(bbox);

      expect(polygon.coordinates).toHaveLength(1); // One outer ring
      const ring = polygon.coordinates[0];
      expect(ring).toHaveLength(5); // 5 points (4 corners + closing point)
      expect(ring[0]).toEqual(ring[4]); // First and last points are identical
    });

    it('should create polygon with correct corner coordinates', () => {
      const bbox: [number, number, number, number] = [
        -97.238218, 43.499476, -89.498952, 49.384458,
      ];
      const polygon = bboxToPolygon(bbox);
      const ring = polygon.coordinates[0];

      // Check that all four corners are represented
      const [minLon, minLat, maxLon, maxLat] = bbox;
      
      // Ring should contain all four corners in some order
      const expectedPoints = [
        [minLon, minLat], // SW
        [maxLon, minLat], // SE
        [maxLon, maxLat], // NE
        [minLon, maxLat], // NW
      ];

      // First 4 points should match the expected corners
      expect(ring.slice(0, 4)).toEqual(expect.arrayContaining(expectedPoints));
    });

    it('should handle small bboxes correctly', () => {
      const bbox: [number, number, number, number] = [
        -122.3321, 47.6062, -122.3320, 47.6063,
      ];
      const polygon = bboxToPolygon(bbox);

      expect(polygon.type).toBe('Polygon');
      expect(polygon.coordinates[0]).toHaveLength(5);
    });
  });

  describe('buildSearchRequest', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
    });

    it('should build boundary search request for region with bbox', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: ['region'],
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [
          number,
          number,
          number,
          number,
        ],
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('boundary');
      expect(result.queryParams.geo_type).toBe('boundary');
      expect(result.queryParams.query).toBe('food banks');
      expect(result.body.geometry).toBeDefined();
      expect(result.body.geometry?.type).toBe('Polygon');
      expect(result.queryParams.coords).toBeUndefined();
      expect(result.queryParams.distance).toBeUndefined();
    });

    it('should build proximity search request for city', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Seattle',
        searchCoordinates: [-122.3321, 47.6062],
        searchDistance: '10',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('proximity');
      expect(result.queryParams.coords).toBe('-122.3321,47.6062');
      expect(result.queryParams.distance).toBe('10');
      expect(result.queryParams.query).toBe('food banks');
      expect(result.body).toEqual({});
      expect(result.queryParams.geo_type).toBeUndefined();
    });

    it('should build proximity search when no location is specified', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'taxonomy',
        searchLocation: '',
        searchCoordinates: [],
        searchDistance: '',
        searchPlaceType: [],
        searchBbox: null,
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('proximity');
      expect(result.queryParams.coords).toBeUndefined();
      expect(result.queryParams.distance).toBeUndefined();
      expect(result.queryParams.query).toBe('food banks');
      expect(result.body).toEqual({});
    });

    it('should build proximity search when feature flag is disabled', () => {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'false';

      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: ['region'],
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [
          number,
          number,
          number,
          number,
        ],
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('proximity');
      expect(result.queryParams.coords).toBe('-94.199117,46.343406');
      expect(result.queryParams.distance).toBe('0');
      expect(result.body).toEqual({});
    });

    it('should default distance to "0" when not specified', () => {
      const searchStore = {
        query: 'crisis hotline',
        queryLabel: '',
        queryType: '',
        searchLocation: 'Duluth',
        searchCoordinates: [-92.1005, 46.7867],
        searchDistance: '',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('proximity');
      expect(result.queryParams.distance).toBe('0');
    });

    it('should handle empty query gracefully', () => {
      const searchStore = {
        query: '',
        queryLabel: '',
        queryType: '',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: ['region'],
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [
          number,
          number,
          number,
          number,
        ],
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('boundary');
      expect(result.queryParams.query).toBeUndefined();
      expect(result.body.geometry).toBeDefined();
    });

    it('should trim whitespace from query parameters', () => {
      const searchStore = {
        query: '  food banks  ',
        queryLabel: '  food banks  ',
        queryType: '  text  ',
        searchLocation: 'Seattle',
        searchCoordinates: [-122.3321, 47.6062],
        searchDistance: '  10  ',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const result = buildSearchRequest(searchStore);

      expect(result.queryParams.query).toBe('food banks');
      expect(result.queryParams.query_label).toBe('food banks');
      expect(result.queryParams.query_type).toBe('text');
      expect(result.queryParams.distance).toBe('10');
    });

    it('should handle country place type (boundary search)', () => {
      const searchStore = {
        query: 'shelters',
        queryLabel: '',
        queryType: '',
        searchLocation: 'United States',
        searchCoordinates: [-98.5795, 39.8283],
        searchDistance: '0',
        searchPlaceType: ['country'],
        searchBbox: [-125.0, 24.0, -66.0, 49.0] as [number, number, number, number],
      };

      const result = buildSearchRequest(searchStore);

      expect(result.method).toBe('boundary');
      expect(result.queryParams.geo_type).toBe('boundary');
      expect(result.body.geometry).toBeDefined();
    });
  });
});
