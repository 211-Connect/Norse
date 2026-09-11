import { GeocodeResult } from '@/types/resource';

export type GeocoderOptions = { locale: string; tenantId: string };

export abstract class BaseGeocoderAdapter {
  abstract forwardGeocode(
    address: string,
    options: GeocoderOptions,
  ): Promise<GeocodeResult[]>;

  abstract reverseGeocode(
    coordinates: string,
    options: GeocoderOptions,
  ): Promise<GeocodeResult[]>;
}
