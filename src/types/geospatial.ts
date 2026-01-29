export interface MapboxContext {
  id: string;
  text: string;
  wikidata?: string;
  short_code?: string;
  mapbox_id?: string;
  [key: string]: any; // Allow dynamic locale keys like text_es
}

export interface MapboxFeature {
  id: string;
  type: 'Feature';
  place_type: string[];
  relevance: number;
  properties: Record<string, any>; // Generic properties object
  text: string; // "Minnesota"
  place_name: string; // "Minnesota, United States"
  bbox?: [number, number, number, number]; // BBox is array of 4 numbers
  center?: [number, number];
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  context?: MapboxContext[];
  [key: string]: any; // Allow dynamic locale keys like place_name_es
}

export interface MapboxResponse {
  type: 'FeatureCollection';
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}
