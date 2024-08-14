import { MAPBOX_API_KEY } from '@/shared/lib/constants';
import { BaseMapAdapter } from './base-map-adapter';

export class MapboxAdapter extends BaseMapAdapter {
  forwardGeocode(): Promise<null> {
    throw new Error('Method not implemented.');
  }
  reverseGeocode(): Promise<null> {
    throw new Error('Method not implemented.');
  }
}
