import { BaseMapAdapter } from '../adapters/map/base-map-adapter';

export class MapService {
  static async forwardGeocode(
    address: string,
    options: { adapter: BaseMapAdapter; locale: string },
  ) {
    return await options.adapter.forwardGeocode(address, {
      locale: options.locale,
    });
  }

  static async reverseGeocode(
    coordinates: string,
    options: { adapter: BaseMapAdapter; locale: string },
  ) {
    return await options.adapter.reverseGeocode(coordinates, {
      locale: options.locale,
    });
  }
}
