import { BaseGeocoderAdapter } from './base-geocoder-adapter';
import { forwardGeocode as forwardGeocodeAction } from '../../serverActions/geocoding/forwardGeocode';
import { reverseGeocode as reverseGeocodeAction } from '../../serverActions/geocoding/reverseGeocode';
import { GeocodeResult } from '@/types/resource';

export class MapboxAdapter extends BaseGeocoderAdapter {
  async forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]> {
    return await forwardGeocodeAction(address, options);
  }

  async reverseGeocode(
    coords: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]> {
    return await reverseGeocodeAction(coords, options);
  }
}
