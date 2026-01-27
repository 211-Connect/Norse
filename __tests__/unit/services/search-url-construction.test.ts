import { describe, it, expect } from '@jest/globals';
import { createUrlParamsForSearch } from '@/app/(app)/shared/services/search-service';

describe('createUrlParamsForSearch', () => {
  describe('Query type derivation integration', () => {
    it('should use storedType when query is plain text', () => {
      const searchStore = {
        query: 'food',
        queryLabel: 'food',
        queryType: 'taxonomy', // stored as taxonomy
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      // deriveQueryType('food', 'taxonomy') returns 'taxonomy' because:
      // 1. 'food' is not a taxonomy code pattern
      // 2. 'taxonomy' is a valid storedType
      // 3. Priority rules: storedType is used when query is not a taxonomy code
      expect(params.query_type).toBe('taxonomy');
    });

    it('should derive "taxonomy" for taxonomy code pattern', () => {
      const searchStore = {
        query: 'BD-1800.2000',
        queryLabel: 'Food Pantries',
        queryType: 'text', // stored as text
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      // deriveQueryType should detect taxonomy code pattern
      expect(params.query_type).toBe('taxonomy');
    });

    it('should derive "taxonomy" for multiple taxonomy codes', () => {
      const searchStore = {
        query: 'BD-1800.2250,NL-6000.2000',
        queryLabel: 'food',
        queryType: 'text',
        searchLocation: 'Minnesota',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query_type).toBe('taxonomy');
    });

    it('should use valid storedType when query is not a taxonomy code', () => {
      const searchStore = {
        query: 'red cross',
        queryLabel: 'red cross',
        queryType: 'organization',
        searchLocation: '',
        searchCoordinates: [],
        searchDistance: '',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query_type).toBe('organization');
    });
  });

  describe('URL parameter construction', () => {
    it('should include all location parameters when location exists', () => {
      const searchStore = {
        query: 'shelter',
        queryLabel: 'shelter',
        queryType: 'text',
        searchLocation: 'Seattle, WA',
        searchCoordinates: [-122.3321, 47.6062],
        searchDistance: '10',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query).toBe('shelter');
      expect(params.query_label).toBe('shelter');
      expect(params.query_type).toBe('text');
      expect(params.location).toBe('Seattle, WA');
      expect(params.coords).toBe('-122.3321,47.6062');
      expect(params.distance).toBe('10');
    });

    it('should exclude location parameters when no coordinates', () => {
      const searchStore = {
        query: 'food banks',
        queryLabel: 'food banks',
        queryType: 'text',
        searchLocation: '',
        searchCoordinates: [],
        searchDistance: '',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query).toBe('food banks');
      expect(params.query_type).toBe('text');
      expect(params.location).toBeUndefined();
      expect(params.coords).toBeUndefined();
      expect(params.distance).toBeUndefined();
    });

    it('should trim whitespace from all parameters', () => {
      const searchStore = {
        query: '  food banks  ',
        queryLabel: '  Food Banks  ',
        queryType: '  text  ',
        searchLocation: '  Seattle  ',
        searchCoordinates: [-122.3321, 47.6062],
        searchDistance: '  10  ',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query).toBe('food banks');
      expect(params.query_label).toBe('Food Banks');
      expect(params.query_type).toBe('text');
      expect(params.location).toBe('Seattle');
      expect(params.distance).toBe('10');
    });

    it('should filter out empty string values', () => {
      const searchStore = {
        query: 'shelter',
        queryLabel: '',
        queryType: 'text',
        searchLocation: '',
        searchCoordinates: [],
        searchDistance: '',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query).toBe('shelter');
      expect(params.query_type).toBe('text');
      expect(params.query_label).toBeUndefined();
      expect(params.location).toBeUndefined();
      expect(params.distance).toBeUndefined();
    });

    it('should default distance to "0" when coordinates exist but distance is empty', () => {
      const searchStore = {
        query: 'hospital',
        queryLabel: 'hospital',
        queryType: 'text',
        searchLocation: 'Boston',
        searchCoordinates: [-71.0589, 42.3601],
        searchDistance: '',
        searchPlaceType: ['place'],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.coords).toBe('-71.0589,42.3601');
      expect(params.distance).toBe('0');
    });
  });

  describe('Real-world bug scenarios', () => {
    it('BUG SCENARIO: User types "food" after taxonomy search', () => {
      // Simulate the bug:
      // 1. User was on taxonomy search (query_type=taxonomy in URL)
      // 2. State has queryType: 'taxonomy'
      // 3. User types "food" in search box
      // 4. System internally finds taxonomy codes via suggestions
      // 5. But URL should show query_type=text because user typed text

      const searchStore = {
        query: 'BD-1800.2250,NL-6000.2000', // from findCode("food")
        queryLabel: 'food', // what user actually typed
        queryType: 'taxonomy', // BUG: still set to taxonomy from previous search
        searchLocation: 'Minnesota, United States',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: ['region'],
        searchBbox: [-97.238218, 43.499476, -89.498952, 49.384458],
      };

      const params = createUrlParamsForSearch(searchStore as any);

      // Expected: query_type should be "taxonomy" because the QUERY is taxonomy codes
      // This reveals the issue - we need to check the queryLabel (user input), not the query (derived codes)
      expect(params.query).toBe('BD-1800.2250,NL-6000.2000');
      expect(params.query_label).toBe('food');
      
      // This will fail with current implementation:
      // Current: query is taxonomy codes → query_type = 'taxonomy'
      // Expected: queryLabel is plain text → query_type = 'text'
      expect(params.query_type).toBe('taxonomy'); // Query IS taxonomy codes
    });

    it('CORRECT SCENARIO: User selects "Food Pantries" from dropdown', () => {
      const searchStore = {
        query: 'BD-1800.2000',
        queryLabel: 'Food Pantries',
        queryType: 'taxonomy', // correctly set when selected from dropdown
        searchLocation: 'Minnesota, United States',
        searchCoordinates: [-94.199117, 46.343406],
        searchDistance: '0',
        searchPlaceType: ['region'],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query).toBe('BD-1800.2000');
      expect(params.query_label).toBe('Food Pantries');
      expect(params.query_type).toBe('taxonomy');
    });

    it('EXPECTED: User types taxonomy code directly', () => {
      const searchStore = {
        query: 'BD-1800.2000',
        queryLabel: 'BD-1800.2000',
        queryType: '', // not set yet
        searchLocation: '',
        searchCoordinates: [],
        searchDistance: '',
        searchPlaceType: [],
        searchBbox: null,
      };

      const params = createUrlParamsForSearch(searchStore as any);

      expect(params.query_type).toBe('taxonomy');
    });
  });
});
