import { bboxPolygon } from '@turf/bbox-polygon';
import type { Polygon } from 'geojson';
import { TaxonomyService } from '../services/taxonomy-service';
import { BBox, Coordinates } from '@/types/resource';

/**
 * Check if advanced geospatial filtering is enabled via feature flag
 * @returns {boolean} True if feature flag is enabled
 */
export function isAdvancedGeoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG === 'true';
}

/**
 * Determine if a place should use boundary search based on type and bbox
 * 
 * Conditions (ALL must be true):
 * 1. Feature flag is enabled
 * 2. Place has valid bbox (4 numbers)
 * 3. Place type is 'region' or 'country'
 * 
 * @param {string[] | null | undefined} placeType - Array of place types from Mapbox
 * @param {BBox | null | undefined} bbox - Bounding box coordinates
 * @returns {boolean} True if boundary search should be used
 */
export function shouldUseBoundarySearch(
  placeType: string[] | null | undefined,
  bbox: BBox | null | undefined,
): boolean {
  // Check feature flag first (fast fail)
  if (!isAdvancedGeoEnabled()) return false;
  
  // Validate bbox exists and has correct structure
  if (!bbox || bbox.length !== 4) return false;
  
  // Validate place_type exists
  if (!placeType || placeType.length === 0) return false;
  
  // Only use boundary search for regions and countries
  return placeType.includes('region') || placeType.includes('country');
}

/**
 * Convert Mapbox bbox to GeoJSON Polygon using Turf.js
 * 
 * Input format (Mapbox bbox): [minLon, minLat, maxLon, maxLat]
 * Output format: GeoJSON Polygon with closed ring (5 points)
 * 
 * @param {BBox} bbox - Bounding box from Mapbox
 * @returns {Polygon} GeoJSON Polygon geometry
 */
export function bboxToPolygon(bbox: BBox): Polygon {
  // Use Turf.js to convert bbox to polygon
  // bboxPolygon returns a Feature<Polygon>, we extract the geometry
  const feature = bboxPolygon(bbox);
  return feature.geometry;
}

/**
 * Interface for search request parameters
 */
export interface SearchRequestParams {
  method: 'boundary' | 'proximity';
  queryParams: Record<string, string>;
  body: { geometry?: Polygon };
}

/**
 * Build search request params based on search mode (boundary vs proximity)
 * 
 * This is the main orchestrator that decides which search mode to use and
 * constructs the appropriate request parameters.
 * 
 * @param {Object} searchStore - Search state from searchAtom
 * @returns {SearchRequestParams} Request configuration for search API
 */
export function buildSearchRequest(
  searchStore: {
    query: string;
    queryLabel: string;
    queryType: string;
    searchLocation: string;
    searchCoordinates: Coordinates | number[] | any[];
    searchDistance: string;
    searchPlaceType: string[];
    searchBbox: BBox | null;
  },
): SearchRequestParams {
  const hasLocation = searchStore.searchCoordinates?.length === 2;
  const useBoundary = shouldUseBoundarySearch(
    searchStore.searchPlaceType,
    searchStore.searchBbox,
  );

  // Base query params (shared by both modes)
  const baseParams: Record<string, string> = {};
  
  if (searchStore.query?.trim()) {
    baseParams.query = searchStore.query.trim();
  }
  if (searchStore.queryLabel?.trim()) {
    baseParams.query_label = searchStore.queryLabel.trim();
  }
  if (searchStore.queryType?.trim()) {
    baseParams.query_type = searchStore.queryType.trim();
  }
  if (hasLocation && searchStore.searchLocation?.trim()) {
    baseParams.location = searchStore.searchLocation.trim();
  }

  if (useBoundary && searchStore.searchBbox) {
    // Boundary Search Mode
    return {
      method: 'boundary',
      queryParams: {
        ...baseParams,
        geo_type: 'boundary',
      },
      body: {
        geometry: bboxToPolygon(searchStore.searchBbox),
      },
    };
  } else if (hasLocation) {
    // Proximity Search Mode (with location)
    return {
      method: 'proximity',
      queryParams: {
        ...baseParams,
        coords: searchStore.searchCoordinates.join(','),
        distance: searchStore.searchDistance?.trim() || '0',
      },
      body: {},
    };
  } else {
    // No location specified (search everywhere)
    return {
      method: 'proximity',
      queryParams: baseParams,
      body: {},
    };
  }
}

/**
 * Valid query type options supported by the Norse API
 */
const VALID_QUERY_TYPES = ['text', 'taxonomy', 'organization', 'more_like_this'] as const;
type ValidQueryType = typeof VALID_QUERY_TYPES[number];

/**
 * Check if a string is a valid query type
 */
function isValidQueryType(type: string | undefined): type is ValidQueryType {
  if (!type) return false;
  return VALID_QUERY_TYPES.includes(type as ValidQueryType);
}

/**
 * Determines the correct query type based on the query string.
 * 
 * Logic:
 * 1. If query matches a taxonomy code pattern → 'taxonomy'
 * 2. If storedType is a valid query type → storedType
 * 3. Otherwise → 'text' (default)
 * 
 * This ensures we never send invalid query types to the API.
 * 
 * @param query - The search query string
 * @param storedType - The query type from state (may be invalid user input)
 * @returns A valid query type: 'taxonomy', 'text', 'organization', or 'more_like_this'
 */
export function deriveQueryType(query: string | undefined, storedType: string | undefined): string {
  const normalizedQuery = query?.trim();
  
  // Check if query is a taxonomy code (highest priority)
  if (normalizedQuery && TaxonomyService.isTaxonomyCode(normalizedQuery)) {
    return 'taxonomy';
  }

  // Validate and use storedType if it's valid
  const trimmedType = storedType?.trim();
  if (isValidQueryType(trimmedType)) {
    return trimmedType;
  }

  // Default to 'text' for keyword search
  return 'text';
}
