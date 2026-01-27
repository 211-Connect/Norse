import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocationCached } from '@/app/(app)/shared/services/geocoding-service';

/**
 * GET /api/geocode?location=Minnesota&locale=en
 * 
 * Wraps Mapbox geocoding with Redis caching
 * Returns place metadata needed for geospatial search
 * 
 * @param location - Required. Location string to geocode
 * @param locale - Optional. Language locale (default: 'en')
 * 
 * @returns 200 - Geocoded location data with Cache-Control headers
 * @returns 400 - Missing location parameter
 * @returns 404 - Location not found
 * @returns 500 - Internal server error
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');
  const locale = searchParams.get('locale') || 'en';

  if (!location) {
    return NextResponse.json(
      { error: 'Location parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeLocationCached(location, locale);

    if (!result) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        // Allow browser to cache for 1 hour (same as Redis TTL)
        'Cache-Control': 'public, max-age=3600',
      }
    });
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
