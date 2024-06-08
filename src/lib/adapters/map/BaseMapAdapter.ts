import { LngLatLike } from 'maplibre-gl';

export interface MapSearchResult {
  address: string;
  coordinates: LngLatLike;
}

export abstract class BaseMapAdapter {
  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('Map adapters are meant to be used on the client only.');
    }
  }

  abstract search(query: string): Promise<MapSearchResult[]>;

  abstract reverseGeocode(coords: string): Promise<MapSearchResult>;

  abstract forwardGeocode(address: string): Promise<MapSearchResult>;
}
