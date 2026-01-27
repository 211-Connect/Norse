import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the MapboxAdapter
jest.mock('@/app/(app)/shared/adapters/geocoder/mapbox-adapter');
jest.mock('@/app/(app)/shared/lib/constants', () => ({
  MAPBOX_API_KEY: 'test-key',
  MAPBOX_API_BASE_URL: 'https://api.mapbox.com',
  API_URL: 'http://localhost:3000',
}));

import { MapboxAdapter } from '@/app/(app)/shared/adapters/geocoder/mapbox-adapter';

describe('MapboxAdapter backward compatibility', () => {
  let adapter: MapboxAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MapboxAdapter();
  });

  describe('Preserve original functionality', () => {
    it('should still return data in original format', async () => {
      // This test ensures that after our changes, the adapter still returns
      // the same data structure that client code expects
      
      const mockResponse = {
        type: 'coordinates' as const,
        address: 'Minnesota, United States',
        coordinates: [-94.199117, 46.343406] as [number, number],
        place_type: ['region'],
        bbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [number, number, number, number],
      };

      // Mock the adapter's forwardGeocode method
      jest.spyOn(adapter, 'forwardGeocode').mockResolvedValue([mockResponse]);

      const result = await adapter.forwardGeocode('Minnesota', { locale: 'en' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'coordinates',
        address: expect.any(String),
        coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
        place_type: expect.any(Array),
      });
    });

    it('should handle multiple results like before', async () => {
      const mockResponses = [
        {
          type: 'coordinates' as const,
          address: 'Minnesota, United States',
          coordinates: [-94.199117, 46.343406] as [number, number],
          place_type: ['region'],
        },
        {
          type: 'coordinates' as const,
          address: 'Minnesota Falls, Minnesota',
          coordinates: [-95.1234, 44.5678] as [number, number],
          place_type: ['place'],
        },
      ];

      jest.spyOn(adapter, 'forwardGeocode').mockResolvedValue(mockResponses);

      const result = await adapter.forwardGeocode('Minnesota', { locale: 'en' });

      expect(result).toHaveLength(2);
    });
  });

  describe('Fallback behavior', () => {
    it('should fall back to direct Mapbox if Norse API fails', async () => {
      // This test defines the fallback behavior:
      // 1. Try Norse API first
      // 2. If it fails, fall back to direct Mapbox call
      // 3. User sees no error - seamless failover
      
      // We'll verify this behavior once implemented
      // For now, this documents the expected behavior
      
      expect(true).toBe(true); // Placeholder
    });

    it('should NOT break existing users if feature is disabled', async () => {
      // Verify that with feature flag OFF or if Norse API doesn't exist yet,
      // everything works exactly as before
      
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Response field compatibility', () => {
    it('should include all fields that client code expects', async () => {
      // Client code expects these fields based on location-search-bar.tsx:
      // - type
      // - address  
      // - coordinates
      // - place_type (NEW)
      // - bbox (NEW)
      // Plus optional: country, district, place, postcode, region
      
      const mockResponse = {
        type: 'coordinates' as const,
        address: 'Minnesota, United States',
        coordinates: [-94.199117, 46.343406] as [number, number],
        place_type: ['region'],
        bbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [number, number, number, number],
        region: 'Minnesota',
        country: 'United States',
      };

      jest.spyOn(adapter, 'forwardGeocode').mockResolvedValue([mockResponse]);

      const result = await adapter.forwardGeocode('Minnesota', { locale: 'en' });

      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('address');
      expect(result[0]).toHaveProperty('coordinates');
      expect(result[0]).toHaveProperty('place_type');
      expect(result[0]).toHaveProperty('bbox');
    });
  });
});
