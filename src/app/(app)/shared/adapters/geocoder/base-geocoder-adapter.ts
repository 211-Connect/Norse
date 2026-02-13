import { GeocodeResult } from '@/types/resource';

export abstract class BaseGeocoderAdapter {
  abstract forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]>;

  abstract reverseGeocode(
    coordinates: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]>;
}
