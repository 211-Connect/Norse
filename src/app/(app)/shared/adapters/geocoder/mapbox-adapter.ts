import { GeocodeResult } from '@/types/resource';

import { forwardGeocode as forwardGeocodeAction } from '../../serverActions/geocoding/forwardGeocode';
import { reverseGeocode as reverseGeocodeAction } from '../../serverActions/geocoding/reverseGeocode';
import { BaseGeocoderAdapter } from './base-geocoder-adapter';

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
