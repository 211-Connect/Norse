import { BaseGeocoderAdapter } from './base-geocoder-adapter';
import { forwardGeocode as forwardGeocodeAction } from '../../serverActions/geocoding/forwardGeocode';
import { reverseGeocode as reverseGeocodeAction } from '../../serverActions/geocoding/reverseGeocode';

export class MapboxAdapter extends BaseGeocoderAdapter {
  async forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<
    {
      type: 'coordinates' | 'invalid';
      address: string;
      coordinates: [number, number];
      country?: string;
      district?: string;
      place?: string;
      postcode?: string;
      region?: string;
    }[]
  > {
    return await forwardGeocodeAction(address, options);
  }

  async reverseGeocode(
    coords: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
      country?: string;
      district?: string;
      place?: string;
      postcode?: string;
      region?: string;
    }[]
  > {
    return await reverseGeocodeAction(coords, options);
  }
}
