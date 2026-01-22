
import { distanceBetweenCoordsInKm } from "./utils";

export type MapboxFeature = {
  id: string;
  place_type?: string[];
  bbox?: [number, number, number, number];
  center: [number, number];
  text: string;
  context?: {
    id: string;
    text: string;
  }[];
};

export type UrbanizationLevel =
  | 'major_metro'
  | 'urban_neighborhood'
  | 'urban_locality'
  | 'rural_small_town'
  | 'rural_locality'
  | 'region'
  | 'district'
  | 'address'
  | 'poi'
  | 'postcode'
  | 'unknown';

export type GeoStrategy = 
  | { type: 'bbox'; bbox: [number, number, number, number] }
  | { type: 'radius'; radius: number };

// Major cities list removed in favor of BBox heuristic

export function determineUrbanization(feature: MapboxFeature): UrbanizationLevel {
  if (!feature || !feature.place_type || feature.place_type.length === 0) {
    return 'unknown';
  }

  const placeType = feature.place_type[0];
  const bbox = feature.bbox;
  const context = feature.context || [];
  // const textLower = feature.text.toLowerCase(); // Unused now

  // Region / District (State / County)
  if (placeType === 'region') return 'region';
  if (placeType === 'district') return 'district';

  // Address / POI / Postcode
  if (placeType === 'address') return 'address';
  if (placeType === 'poi') return 'poi';
  if (placeType === 'postcode') return 'postcode';

  // Urban Neighborhoods
  if (placeType === 'neighborhood') return 'urban_neighborhood';

  // Places (Cities, Towns)
  if (placeType === 'place') {
    // Heuristic: Check bbox span to distinguish rural vs urban/metro
    // A small bbox for a "place" usually implies a small town (rural)
    // A large bbox usually implies a larger city/metro area
    if (bbox) {
       const bboxSpan = Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]);
       // Threshold: > 0.15 degrees (~15km) -> Major Metro
       if (bboxSpan >= 0.15) {
         return 'major_metro';
       } else {
         return 'rural_small_town';
       }
    }
    
    // Fallback if no bbox
    return 'rural_small_town'; 
  }

  // Localities
  if (placeType === 'locality') {
    // Without a specific list, we default localities (townships) to stricter rural logic
    // to ensure we capture enough area.
    return 'rural_locality';
  }

  return 'unknown';
}

/**
 * Determines whether to use BBOX or RADIUS strategy based on urbanization/feature type.
 */
export function determineGeoStrategy(feature: MapboxFeature): GeoStrategy {
  if (!feature) {
    return { type: 'radius', radius: 15 };
  }
  const urbanization = determineUrbanization(feature);

  // Administrative Levels -> BBOX
  if (urbanization === 'region' || urbanization === 'district') {
    if (feature.bbox) {
      return { type: 'bbox', bbox: feature.bbox };
    }
    // Fallback if no bbox for region (rare case for Mapbox regions) -> wide radius
    return { type: 'radius', radius: 150 };
  }

  // Everything else -> RADIUS (Proximity)
  return { type: 'radius', radius: calculateSmartRadius(feature) };
}


/**
 * Calculates a "Smart Radius" (in miles) based on the urbanization level.
 * @param feature 
 * @returns radius in miles
 */
export function calculateSmartRadius(feature: MapboxFeature): number {
  const urbanization = determineUrbanization(feature);
  const bbox = feature.bbox;

  // Helper to convert KM to Miles
  const kmToMiles = (km: number) => Math.round(km * 0.621371);

  switch (urbanization) {
    case 'region':
    case 'district':
       // Should be handled by BBOX strategy, but as fallback/utility:
       // Use center-to-corner distance
      if (bbox && feature?.center) {
        const center: [number, number] = feature.center; // [lng, lat]
        const corner: [number, number] = [bbox[2], bbox[3]]; // [maxLng, maxLat]
        
        const distKm = distanceBetweenCoordsInKm(center, corner);
        return kmToMiles(distKm); 
      }
      return 150; 

    case 'urban_neighborhood':
      return kmToMiles(5); // 5km -> ~3 miles

    case 'urban_locality':
      return kmToMiles(10); // ~6 miles

    case 'major_metro':
       if (bbox) {
         const bboxSpan = Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]);
         const radiusKm = (bboxSpan * 111 / 2); // approximate
         return kmToMiles(radiusKm);
       }
      return kmToMiles(15); 

    case 'rural_small_town':
       return kmToMiles(40); // ~25 miles

    case 'rural_locality':
       return kmToMiles(30); // ~18 miles
    
    case 'address':
    case 'poi':
    case 'postcode':
       return kmToMiles(15); // ~10 miles

    default:
      return 15; // Default fallback
  }
}
