import { BBox, Point } from 'geojson';

export interface MapboxContext {
  id: string;
  text: string;
  wikidata?: string;
  short_code?: string;
  mapbox_id?: string;
  // Locale-specific text fields (e.g., text_en, text_es)
  [key: `text_${string}`]: string | undefined;
}

export interface MapboxFeature {
  id: string;
  type: 'Feature';
  place_type: string[];
  relevance: number;
  properties: Record<string, string | number | boolean | null>;
  text: string;
  place_name: string;
  bbox?: BBox;
  center?: [number, number];
  geometry: Point;
  context?: MapboxContext[];
  // Locale-specific place names (e.g., place_name_en, place_name_es)
  [key: `place_name_${string}`]: string | undefined;
}

export interface MapboxResponse {
  type: 'FeatureCollection';
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}
