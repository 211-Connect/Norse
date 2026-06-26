import { bboxPolygon } from '@turf/bbox-polygon';
import type { Polygon } from 'geojson';

import { SearchEngine } from '@/types/appConfig';
import { BBox } from '@/types/resource';

import { FindResourcesQuery } from '../services/search-service';

/**
 * Check if advanced geospatial filtering is enabled via feature flag
 * @returns {boolean} True if feature flag is enabled
 */
export function isAdvancedGeoEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG ===
    'true'
  );
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
  searchStore: FindResourcesQuery,
  searchEngine: SearchEngine,
): SearchRequestParams {
  const hasLocation = searchStore.coordinates?.length === 2;
  const useBoundary = shouldUseBoundarySearch(
    searchStore.placeType,
    searchStore.bbox,
  );

  // Base query params (shared by both modes)
  const baseParams: Record<string, string> = {};

  if (searchStore.query?.trim()) {
    baseParams.query = searchStore.query.trim();
  }
  if (searchStore.queryLabel?.trim()) {
    baseParams.query_label = searchStore.queryLabel.trim();
  }

  if (searchStore.age !== undefined) {
    baseParams.age = String(searchStore.age);
  }

  baseParams.query_type = deriveQueryType({
    originQueryType: searchStore.queryType,
    query: searchStore.query,
    searchEngine,
  });

  if (hasLocation && searchStore.location?.trim()) {
    baseParams.location = searchStore.location.trim();
  }

  if (useBoundary && searchStore.bbox) {
    // Boundary Search Mode
    return {
      method: 'boundary',
      queryParams: {
        ...baseParams,
        geo_type: 'boundary',
      },
      body: {
        geometry: bboxToPolygon(searchStore.bbox),
      },
    };
  } else if (hasLocation) {
    // Proximity Search Mode (with location)
    return {
      method: 'proximity',
      queryParams: {
        ...baseParams,
        coords: searchStore.coordinates!.join(','),
        distance: searchStore.distance?.trim() || '0',
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
export enum QueryType {
  Text = 'text',
  Hybrid = 'hybrid',
  Taxonomy = 'taxonomy',
  Organization = 'organization',
  MoreLikeThis = 'more_like_this',
}

const CODE_PATTERN = /^[a-zA-Z]{1,2}(-\d{1,4}([.-]\d{1,4}){0,3})?$/i;
const JSON_PATTERN = /^\{.*\}$/;

function isTaxonomyQuery(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  if (JSON_PATTERN.test(value)) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object';
    } catch {
      return false;
    }
  }

  return value.split(',').every((part) => CODE_PATTERN.test(part));
}

type DeriveQueryTypeArgs = {
  searchEngine: SearchEngine;
  originQueryType: string | undefined;
  query: string | undefined;
};

export function deriveQueryType({
  searchEngine,
  originQueryType,
  query,
}: DeriveQueryTypeArgs): QueryType {
  if (originQueryType === 'taxonomy') {
    return QueryType.Taxonomy;
  }

  if (isTaxonomyQuery(query)) {
    return QueryType.Taxonomy;
  }

  return searchEngine === 'hybrid' || searchEngine === 'ai_classification'
    ? QueryType.Hybrid
    : QueryType.Text;
}
