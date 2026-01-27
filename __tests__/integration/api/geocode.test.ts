/**
 * @jest-environment node
 */
import { GET } from '@/app/(app)/api/geocode/route';
import { NextRequest } from 'next/server';
import { geocodeLocationCached } from '@/app/(app)/shared/services/geocoding-service';
import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock the cached geocoding service
jest.mock('@/app/(app)/shared/services/geocoding-service', () => ({
  geocodeLocationCached: jest.fn(),
}));

const mockGeocodeLocationCached = geocodeLocationCached as jest.MockedFunction<typeof geocodeLocationCached>;

describe('Geocode API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and geocoded data when location is provided', async () => {
    const mockResult = {
      place_type: ['region'],
      bbox: [-97.238218, 43.499476, -89.498952, 49.384458] as [number, number, number, number],
      coordinates: [-94.199117, 46.343406] as [number, number],
      address: 'Minnesota, United States',
    };

    mockGeocodeLocationCached.mockResolvedValue(mockResult);

    const req = new NextRequest('http://localhost:3000/api/geocode?location=Minnesota&locale=en');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResult);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(mockGeocodeLocationCached).toHaveBeenCalledWith('Minnesota', 'en');
  });

  it('should return 400 when location parameter is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/geocode?locale=en');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Location parameter is required');
  });

  it('should return 404 when location is not found', async () => {
    mockGeocodeLocationCached.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/geocode?location=NonExistentPlace');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Location not found');
  });

  it('should use default locale "en" if not provided', async () => {
    mockGeocodeLocationCached.mockResolvedValue({
      place_type: ['region'],
      bbox: [0, 0, 0, 0],
      coordinates: [0, 0],
      address: 'Test',
    });

    const req = new NextRequest('http://localhost:3000/api/geocode?location=Test');
    await GET(req);

    expect(mockGeocodeLocationCached).toHaveBeenCalledWith('Test', 'en');
  });

  it('should return 500 when underlying service fails', async () => {
    mockGeocodeLocationCached.mockRejectedValue(new Error('Redis error'));

    const req = new NextRequest('http://localhost:3000/api/geocode?location=ErrorPlace');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
