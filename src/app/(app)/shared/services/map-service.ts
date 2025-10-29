import { BaseGeocoderAdapter } from '../adapters/geocoder/base-geocoder-adapter';

export class MapService {
  static async forwardGeocode(
    address: string,
    options: { adapter: BaseGeocoderAdapter; locale: string },
  ) {
    return await options.adapter.forwardGeocode(address, {
      locale: options.locale,
    });
  }

  static async reverseGeocode(
    coordinates: string,
    options: { adapter: BaseGeocoderAdapter; locale: string },
  ) {
    return await options.adapter.reverseGeocode(coordinates, {
      locale: options.locale,
    });
  }
}
