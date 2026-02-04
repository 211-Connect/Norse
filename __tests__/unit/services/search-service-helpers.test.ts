import { describe, it, expect } from '@jest/globals';
import {
  extractTotalResults,
  createEmptySearchResult,
  buildAddressFromPhysical,
  createSearchHeaders,
  transformSearchHit,
  executeFallbackSearch,
  executeSearch,
} from '@/app/(app)/shared/utils/searchServiceUtils';

describe('Search Service Helpers', () => {
  describe('extractTotalResults', () => {
    it('should return 0 for null data', () => {
      expect(extractTotalResults(null)).toBe(0);
    });

    it('should return 0 for undefined data', () => {
      expect(extractTotalResults(undefined as any)).toBe(0);
    });

    it('should return 0 when search is missing', () => {
      const data = {} as any;
      expect(extractTotalResults(data)).toBe(0);
    });

    it('should return 0 when hits is missing', () => {
      const data = {
        search: {},
      } as any;
      expect(extractTotalResults(data)).toBe(0);
    });

    it('should return 0 when total is missing', () => {
      const data = {
        search: {
          hits: {},
        },
      } as any;
      expect(extractTotalResults(data)).toBe(0);
    });

    it('should extract number total', () => {
      const data = {
        search: {
          hits: {
            total: 42,
          },
        },
      } as any;
      expect(extractTotalResults(data)).toBe(42);
    });

    it('should extract object total with value', () => {
      const data = {
        search: {
          hits: {
            total: { value: 100, relation: 'eq' },
          },
        },
      } as any;
      expect(extractTotalResults(data)).toBe(100);
    });

    it('should return 0 for object total without value', () => {
      const data = {
        search: {
          hits: {
            total: { relation: 'eq' },
          },
        },
      } as any;
      expect(extractTotalResults(data)).toBe(0);
    });

    it('should handle 0 as valid total', () => {
      const data = {
        search: {
          hits: {
            total: 0,
          },
        },
      } as any;
      expect(extractTotalResults(data)).toBe(0);
    });

    it('should handle 0 as valid total in object form', () => {
      const data = {
        search: {
          hits: {
            total: { value: 0, relation: 'eq' },
          },
        },
      } as any;
      expect(extractTotalResults(data)).toBe(0);
    });
  });

  describe('createEmptySearchResult', () => {
    it('should return empty result structure', () => {
      const result = createEmptySearchResult();
      expect(result).toEqual({
        results: [],
        noResults: true,
        totalResults: 0,
        page: 1,
        filters: {},
      });
    });

    it('should return new object each time', () => {
      const result1 = createEmptySearchResult();
      const result2 = createEmptySearchResult();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should have empty results array', () => {
      const result = createEmptySearchResult();
      expect(result.results).toEqual([]);
      expect(result.results.length).toBe(0);
    });

    it('should have noResults flag set to true', () => {
      const result = createEmptySearchResult();
      expect(result.noResults).toBe(true);
    });

    it('should have totalResults set to 0', () => {
      const result = createEmptySearchResult();
      expect(result.totalResults).toBe(0);
    });

    it('should default to page 1', () => {
      const result = createEmptySearchResult();
      expect(result.page).toBe(1);
    });

    it('should have empty filters object', () => {
      const result = createEmptySearchResult();
      expect(result.filters).toEqual({});
    });
  });

  describe('buildAddressFromPhysical', () => {
    it('should return null for undefined address', () => {
      expect(buildAddressFromPhysical(undefined)).toBe(null);
    });

    it('should return null for incomplete address - missing city', () => {
      const address = {
        address_1: '123 Main St',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address as any)).toBe(null);
    });

    it('should return null for incomplete address - missing address_1', () => {
      const address = {
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address as any)).toBe(null);
    });

    it('should return null for incomplete address - missing state', () => {
      const address = {
        address_1: '123 Main St',
        city: 'Seattle',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address as any)).toBe(null);
    });

    it('should return null for incomplete address - missing postal_code', () => {
      const address = {
        address_1: '123 Main St',
        city: 'Seattle',
        state: 'WA',
      };
      expect(buildAddressFromPhysical(address as any)).toBe(null);
    });

    it('should build address from complete physical address without address_2', () => {
      const address = {
        address_1: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address)).toBe(
        '123 Main St, Seattle, WA, 98101',
      );
    });

    it('should include address_2 when present', () => {
      const address = {
        address_1: '123 Main St',
        address_2: 'Suite 100',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address)).toBe(
        '123 Main St, Suite 100, Seattle, WA, 98101',
      );
    });

    it('should filter out empty string address_2', () => {
      const address = {
        address_1: '123 Main St',
        address_2: '',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address)).toBe(
        '123 Main St, Seattle, WA, 98101',
      );
    });

    it('should filter out null address_2', () => {
      const address = {
        address_1: '123 Main St',
        address_2: null,
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address as any)).toBe(
        '123 Main St, Seattle, WA, 98101',
      );
    });

    it('should filter out undefined address_2', () => {
      const address = {
        address_1: '123 Main St',
        address_2: undefined,
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address)).toBe(
        '123 Main St, Seattle, WA, 98101',
      );
    });

    it('should handle whitespace in address_2', () => {
      const address = {
        address_1: '123 Main St',
        address_2: '   ',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
      };
      expect(buildAddressFromPhysical(address)).toBe(
        '123 Main St, Seattle, WA, 98101',
      );
    });
  });

  describe('createSearchHeaders', () => {
    it('should create basic headers with locale', () => {
      const headers = createSearchHeaders('en-US');
      expect(headers).toEqual({
        'accept-language': 'en-US',
        'x-api-version': '1',
      });
    });

    it('should include tenantId when provided', () => {
      const headers = createSearchHeaders('en-US', 'tenant-123');
      expect(headers).toEqual({
        'accept-language': 'en-US',
        'x-api-version': '1',
        'x-tenant-id': 'tenant-123',
      });
    });

    it('should not include tenantId when undefined', () => {
      const headers = createSearchHeaders('en-US', undefined);
      expect(headers).toEqual({
        'accept-language': 'en-US',
        'x-api-version': '1',
      });
    });

    it('should include Content-Type when isJson is true', () => {
      const headers = createSearchHeaders('en-US', undefined, true);
      expect(headers).toEqual({
        'accept-language': 'en-US',
        'x-api-version': '1',
        'Content-Type': 'application/json',
      });
    });

    it('should include all headers when everything is provided', () => {
      const headers = createSearchHeaders('fr-CA', 'tenant-456', true);
      expect(headers).toEqual({
        'accept-language': 'fr-CA',
        'x-api-version': '1',
        'x-tenant-id': 'tenant-456',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('transformSearchHit', () => {
    const mockHit: any = {
      _id: 'test-id',
      _source: {
        service_at_location_id: 'service-location-id',
        priority: 1,
        service: {
          name: 'Test Service',
          description: 'Test Description',
        },
        name: 'Test Name',
        location: {
          physical_address: {
            address_1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postal_code: '12345',
          },
          point: { lat: 10, lon: 20 },
        },
        facets: {},
        taxonomies: [],
      },
    };

    it('should transform basic hit correctly', () => {
      const result = transformSearchHit(mockHit, 'en-US');

      expect(result._id).toBe('test-id');
      expect(result.id).toBe('service-location-id');
      expect(result.serviceName).toBe('Test Service');
      expect(result.name).toBe('Test Name');
      expect(result.address).toBe('123 Test St, Test City, TS, 12345');
      expect(result.location).toEqual({ lat: 10, lon: 20 });
    });

    it('should handle missing optional fields', () => {
      const minimalHit: any = {
        _id: 'min-id',
        _source: {
          facets: {},
        },
      };

      const result = transformSearchHit(minimalHit, 'en-US');

      expect(result._id).toBe('min-id');
      // Should filter out nulls
      expect(result.serviceName).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should fallback to organization name if name is missing', () => {
      const fallbackHit: any = {
        _id: 'fallback-id',
        _source: {
          name: null,
          organization: {
            name: 'Org Name',
          },
          facets: {},
        },
      };

      const result = transformSearchHit(fallbackHit, 'en-US');
      expect(result.name).toBe('Org Name');
    });

    it('should prefer explicit name over organization name', () => {
      const bothNamesHit: any = {
        _id: 'both-id',
        _source: {
          name: 'Explicit Name',
          organization: {
            name: 'Org Name',
          },
          facets: {},
        },
      };

      const result = transformSearchHit(bothNamesHit, 'en-US');
      expect(result.name).toBe('Explicit Name');
    });

    it('should use service description fallback', () => {
      const descHit: any = {
        _id: 'desc-id',
        _source: {
          description: 'Explicit Desc',
          service: {
            description: 'Service Desc',
          },
          facets: {},
        },
      };

      // Service description takes precedence based on code
      // source.service?.description ?? source.description ?? null
      const result = transformSearchHit(descHit, 'en-US');
      expect(result.description).toBe('Service Desc');
    });
  });

  describe('executeFallbackSearch', () => {
    const mockFetch = jest.fn();
    const baseUrl = 'https://api.example.com/search';
    const queryParams = { q: 'test' };
    const locale = 'en-US';

    beforeEach(() => {
      mockFetch.mockReset();
    });

    it('should execute GET fallback search successfully', async () => {
      const mockResponse = { search: { hits: { total: 5 } } };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executeFallbackSearch(
        mockFetch,
        baseUrl,
        queryParams,
        locale,
        1,
        10,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query_type=more_like_this'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'accept-language': 'en-US',
            'x-api-version': '1',
          }),
        }),
      );
      expect(result).toBe(mockResponse);
    });

    it('should execute POST fallback search successfully', async () => {
      const mockResponse = { search: { hits: { total: 3 } } };
      mockFetch.mockResolvedValue(mockResponse);
      const body = { geometry: {} };

      const result = await executeFallbackSearch(
        mockFetch,
        baseUrl,
        queryParams,
        locale,
        1,
        10,
        'tenant-123',
        'POST',
        body,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query_type=more_like_this'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-tenant-id': 'tenant-123',
          }),
          body: body,
        }),
      );
      expect(result).toBe(mockResponse);
    });

    it('should return null on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await executeFallbackSearch(
        mockFetch,
        baseUrl,
        queryParams,
        locale,
        1,
        10,
      );

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('executeSearch', () => {
    const mockFetch = jest.fn();
    const baseUrl = 'https://api.example.com/search';
    const primaryQueryParams = {
      q: 'test',
      page: 1,
      limit: 10,
      locale: 'en-US',
    };
    const locale = 'en-US';

    beforeEach(() => {
      mockFetch.mockReset();
    });

    it('should execute comprehensive search workflow (success case)', async () => {
      const mockResponse = {
        search: {
          hits: {
            total: 5,
            hits: [{ _id: '1', _source: { name: 'Test Hit' } }],
          },
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await executeSearch(
        mockFetch,
        baseUrl,
        primaryQueryParams,
        locale,
        1,
        10,
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.totalResults).toBe(5);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Test Hit');
    });

    it('should trigger fallback when primary search returns 0 results', async () => {
      const emptyResponse = { search: { hits: { total: 0, hits: [] } } };
      const fallbackResponse = {
        search: {
          hits: {
            total: 2,
            hits: [{ _id: 'fallback-1', _source: { name: 'Fallback Hit' } }],
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce(emptyResponse) // Primary
        .mockResolvedValueOnce(fallbackResponse); // Fallback

      const result = await executeSearch(
        mockFetch,
        baseUrl,
        primaryQueryParams,
        locale,
        1,
        10,
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Verify fallback was called
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('query_type=more_like_this'),
        expect.any(Object),
      );

      expect(result.totalResults).toBe(2);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Fallback Hit');
    });

    it('should handle API errors gracefully by returning empty result', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await executeSearch(
        mockFetch,
        baseUrl,
        primaryQueryParams,
        locale,
        1,
        10,
      );

      expect(result.noResults).toBe(true);
      expect(result.totalResults).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return empty result if response is malformed', async () => {
      mockFetch.mockResolvedValue({ malformed: true });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await executeSearch(
        mockFetch,
        baseUrl,
        primaryQueryParams,
        locale,
        1,
        10,
      );

      expect(result.noResults).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
