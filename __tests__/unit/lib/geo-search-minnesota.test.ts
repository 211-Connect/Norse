import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  isAdvancedGeoEnabled,
  shouldUseBoundarySearch,
  bboxToPolygon,
  buildSearchRequest,
} from '../../../src/app/(app)/shared/lib/search-utils';

import type { SearchRequestParams } from '../../../src/app/(app)/shared/lib/search-utils';

/**
 * Specific tests for debugging the Minnesota bbox issue
 * 
 * Issue: When entering "Minnesota, USA" (place_type="region"), 
 * the system is not creating a bounding box as expected.
 */
describe('Minnesota Bbox Issue - Debug Tests', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;
    // Enable feature flag for these tests
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = 'true';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG;
    } else {
      process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG = originalEnv;
    }
  });

  describe('Real Minnesota Mapbox Response', () => {
    /**
     * This test uses the actual Mapbox response structure for Minnesota
     * Expected from Mapbox:
     * {
     *   "id": "region.230636",
     *   "place_type": ["region"],
     *   "text": "Minnesota",
     *   "place_name": "Minnesota, United States",
     *   "bbox": [-97.238218, 43.499476, -89.498952, 49.384458],
     *   "center": [-94.199117, 46.343406]
     * }
     */
    it('should recognize Minnesota as place_type region', () => {
      const placeType = ['region'];
      const bbox: [number, number, number, number] = [-97.238218, 43.499476, -89.498952, 49.384458];

      const result = shouldUseBoundarySearch(placeType, bbox);
      
      expect(result).toBe(true);
    });

    it('should create valid polygon from Minnesota bbox', () => {
      const bbox: [number, number, number, number] = [-97.238218, 43.499476, -89.498952, 49.384458];
      
      const polygon = bboxToPolygon(bbox);
      
      expect(polygon).toBeDefined();
      expect(polygon.type).toBe('Polygon');
      expect(polygon.coordinates).toBeDefined();
      expect(Array.isArray(polygon.coordinates)).toBe(true);
      expect(polygon.coordinates.length).toBe(1);
      expect(polygon.coordinates[0].length).toBe(5);
    });

    it('should build boundary search request for Minnesota', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota, United States',
        searchCoordinates: [-94.199117, 46.343406], // Minnesota center from Mapbox
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

      // Debug logging
      console.log('Minnesota Test - buildSearchRequest result:', JSON.stringify(result, null, 2));

      expect(result.method).toBe('boundary');
      expect(result.queryParams.geo_type).toBe('boundary');
      expect(result.body.geometry).toBeDefined();
      expect(result.body.geometry?.type).toBe('Polygon');
      
      // Should NOT have proximity search params
      expect(result.queryParams.coords).toBeUndefined();
      expect(result.queryParams.distance).toBeUndefined();
    });
  });

  describe('Edge Cases - Place Type Variations', () => {
    it('should handle place_type as array with single string "region"', () => {
      const bbox: [number, number, number, number] = [-97.238218, 43.499476, -89.498952, 49.384458];
      
      const result = shouldUseBoundarySearch(['region'], bbox);
      
      expect(result).toBe(true);
    });

    it('should handle place_type array with multiple types including region', () => {
      const bbox: [number, number, number, number] = [-97.238218, 43.499476, -89.498952, 49.384458];
      
      // Some Mapbox responses might have multiple place types
      const result = shouldUseBoundarySearch(['region', 'administrative'], bbox);
      
      expect(result).toBe(true);
    });

    it('should fail if bbox is null even with region place_type', () => {
      const result = shouldUseBoundarySearch(['region'], null);
      
      expect(result).toBe(false);
    });

    it('should fail if bbox is undefined even with region place_type', () => {
      const result = shouldUseBoundarySearch(['region'], undefined);
      
      expect(result).toBe(false);
    });

    it('should fail if bbox has wrong number of elements', () => {
      // bbox with only 3 elements instead of 4
      const result = shouldUseBoundarySearch(['region'], [-97.238218, 43.499476, -89.498952] as any);
      
      expect(result).toBe(false);
    });
  });

  describe('State vs City Differentiation', () => {
    it('should use boundary search for Minnesota (state)', () => {
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
      expect(result.body.geometry).toBeDefined();
    });

    it('should use proximity search for Minneapolis (city in Minnesota)', () => {
      const searchStore = {
        query: '',
        queryLabel: '',
        queryType: '',
        searchLocation: 'Minneapolis, Minnesota',
        searchCoordinates: [-93.2650, 44.9778], // Minneapolis center
        searchDistance: '10',
        searchPlaceType: ['place'], // city is 'place' type
        searchBbox: null, // cities might not have bbox or we ignore it
      };

      const result = buildSearchRequest(searchStore);
      
      expect(result.method).toBe('proximity');
      // JavaScript drops trailing zeros, so -93.2650 becomes -93.265
      expect(result.queryParams.coords).toBe('-93.265,44.9778');
      expect(result.queryParams.distance).toBe('10');
      expect(result.body.geometry).toBeUndefined();
    });
  });

  describe('Potential Bugs - Null/Undefined Handling', () => {
    it('should safely handle searchStore with missing searchBbox', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: ['region'],
        searchBbox: null, // MISSING bbox
      };

      const result = buildSearchRequest(searchStore);

      console.log('Missing bbox test result:', JSON.stringify(result, null, 2));

      // Should fall back to proximity search if bbox is missing
      expect(result.method).toBe('proximity');
    });

    it('should safely handle searchStore with undefined searchBbox', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: ['region'],
        searchBbox: undefined as any,
      };

      const result = buildSearchRequest(searchStore);

      // Should fall back to proximity search
      expect(result.method).toBe('proximity');
    });

    it('should safely handle searchStore with empty searchPlaceType array', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: [], // EMPTY array
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [
          number,
          number,
          number,
          number,
        ],
      };

      const result = buildSearchRequest(searchStore);

      console.log('Empty place_type test result:', JSON.stringify(result, null, 2));

      // Should fall back to proximity search
      expect(result.method).toBe('proximity');
    });

    it('should safely handle searchStore with null searchPlaceType', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '10',
        searchPlaceType: null as any,
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [
          number,
          number,
          number,
          number,
        ],
      };

      const result = buildSearchRequest(searchStore);

      // Should fall back to proximity search
      expect(result.method).toBe('proximity');
    });
  });

  describe('Complete Flow - Simulating User Journey', () => {
    it('should handle complete Minnesota search flow', () => {
      // Step 1: User types "Minnesota, USA" in location search
      // Step 2: Mapbox returns this data (simulated)
      const mapboxResponse = {
        id: 'region.230636',
        place_type: ['region'],
        text: 'Minnesota',
        place_name: 'Minnesota, United States',
        bbox: [-97.238218, 43.499476, -89.498952, 49.384458],
        center: [-94.199117, 46.343406],
      };

      // Step 3: This data is stored in searchAtom
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks', 
        queryType: 'text',
        searchLocation: mapboxResponse.place_name,
        searchCoordinates: mapboxResponse.center,
        searchDistance: '10',
        searchPlaceType: mapboxResponse.place_type,
        searchBbox: mapboxResponse.bbox as [number, number, number, number],
      };

      // Step 4: buildSearchRequest is called
      const request = buildSearchRequest(searchStore);

      console.log('Complete flow test - Request:', JSON.stringify(request, null, 2));

      // Step 5: Verify the request is boundary search
      expect(request.method).toBe('boundary');
      expect(request.queryParams.geo_type).toBe('boundary');
      expect(request.queryParams.query).toBe('food banks');
      expect(request.body.geometry).toBeDefined();
      expect(request.body.geometry?.type).toBe('Polygon');
      
      // Verify coordinates are properly converted
      const coords = request.body.geometry?.coordinates[0];
      expect(coords).toBeDefined();
      expect(coords?.length).toBe(5);
      
      // First and last point should be the same (closed polygon)
      expect(coords?.[0]).toEqual(coords?.[4]);
    });
  });

  describe('Coordinate Validation', () => {
    it('should create polygon with correct Minnesota coordinates', () => {
      const bbox: [number, number, number, number] = [-97.238218, 43.499476, -89.498952, 49.384458];
      const polygon = bboxToPolygon(bbox);
      
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const ring = polygon.coordinates[0];
      
      console.log('Minnesota bbox to polygon:', JSON.stringify(polygon, null, 2));
      
      // Verify the ring contains the correct bounding coordinates
      expect(ring.some(coord => coord[0] === minLon && coord[1] === minLat)).toBe(true); // SW corner
      expect(ring.some(coord => coord[0] === maxLon && coord[1] === minLat)).toBe(true); // SE corner
      expect(ring.some(coord => coord[0] === maxLon && coord[1] === maxLat)).toBe(true); // NE corner
      expect(ring.some(coord => coord[0] === minLon && coord[1] === maxLat)).toBe(true); // NW corner
    });
  });
});
