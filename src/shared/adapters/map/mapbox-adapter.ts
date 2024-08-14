import { MAPBOX_API_KEY, MAPBOX_API_BASE_URL } from '@/shared/lib/constants';
import { BaseMapAdapter } from './base-map-adapter';
import axios from 'axios';

export class MapboxAdapter extends BaseMapAdapter {
  async forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
    }[]
  > {
    const res = await axios.get(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${address}.json?access_token=${MAPBOX_API_KEY}&country=US&autocomplete=true&language=${options.locale}`,
    );

    return res?.data?.features?.map((feature) => ({
      address:
        feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
      coordinates: feature?.['geometry']?.['coordinates'],
    }));
  }

  async reverseGeocode(
    coords: string,
    options: { locale: string },
  ): Promise<
    {
      address: string;
      coordinates: [number, number];
    }[]
  > {
    const res = await axios.get(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${coords}.json?access_token=${MAPBOX_API_KEY}&types=address&country=US&language=${options.locale}`,
    );

    return res?.data?.features?.map((feature) => ({
      address:
        feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
      coordinates: feature?.['geometry']?.['coordinates'],
    }));
  }
}
