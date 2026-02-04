import {
  MAPBOX_API_KEY,
  MAPBOX_API_BASE_URL,
} from '@/app/(app)/shared/lib/constants';
import { BaseGeocoderAdapter } from './base-geocoder-adapter';
import { fetchWrapper } from '../../lib/fetchWrapper';
import { GeocodeResult, Coordinates } from '@/types/resource';
import {
  MapboxResponse,
  MapboxFeature,
  MapboxContext,
} from '@/types/geospatial';
import { BBox } from 'geojson';

export class MapboxAdapter extends BaseGeocoderAdapter {
  async forwardGeocode(
    address: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]> {
    // Try Norse API first (with Redis caching)
    // This provides massive performance improvement for common locations
    try {
      const data = await fetchWrapper(
        `/api/geocode?location=${encodeURIComponent(address)}&locale=${options.locale}`,
      );

      if (data) {
        // Return in the same format as direct Mapbox call
        return [
          {
            type: 'coordinates',
            address: data.address,
            coordinates: data.coordinates as Coordinates,
            place_type: data.place_type,
            bbox: data.bbox as BBox,
          },
        ];
      }
    } catch (error) {
      console.warn('Cached geocode failed, using direct Mapbox API:', error);
    }

    // Fallback to direct Mapbox API call (existing behavior)
    const searchParams = new URLSearchParams({
      access_token: MAPBOX_API_KEY || '',
      country: 'US',
      autocomplete: 'true',
      language: options.locale,
    });

    const data = (await fetchWrapper(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${address}.json?${searchParams.toString()}`,
    )) as MapboxResponse;

    let output: GeocodeResult[] = [];

    data?.features?.forEach((feature: MapboxFeature) => {
      let obj: GeocodeResult = {
        type: 'coordinates',
        address:
          feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
        coordinates: feature?.['geometry']?.['coordinates'] as Coordinates,
        // Capture place_type and bbox for advanced geospatial filtering
        place_type: feature?.['place_type'],
        bbox: feature?.['bbox'] as BBox,
      };

      // Add detailed location information to the output for analytics event tracking
      feature?.context?.forEach((item: MapboxContext) => {
        if (item?.id?.startsWith('postcode')) {
          obj['postcode'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('place')) {
          obj['place'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('district')) {
          obj['district'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('region')) {
          obj['region'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('country')) {
          obj['country'] = item?.[`text_${options.locale}`] ?? item?.text;
        }
      });

      output.push(obj);
    });

    return output;
  }

  async reverseGeocode(
    coords: string,
    options: { locale: string },
  ): Promise<GeocodeResult[]> {
    const searchParams = new URLSearchParams({
      access_token: MAPBOX_API_KEY || '',
      types: 'address',
      country: 'US',
      language: options.locale,
    });

    const data = (await fetchWrapper(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${coords}.json?${searchParams.toString()}`,
    )) as MapboxResponse;

    let output: GeocodeResult[] =
      data?.features?.map((feature: MapboxFeature) => ({
        type: 'coordinates',
        address:
          feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
        coordinates: feature?.['geometry']?.['coordinates'] as Coordinates,
      })) || [];

    // Add detailed location information to the output for analytics event tracking
    if (output.length > 0) {
      data?.features[0]?.context?.forEach((item: MapboxContext) => {
        if (item?.id?.startsWith('postcode')) {
          output[0]['postcode'] =
            item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('place')) {
          output[0]['place'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('district')) {
          output[0]['district'] =
            item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('region')) {
          output[0]['region'] = item?.[`text_${options.locale}`] ?? item?.text;
        } else if (item?.id?.startsWith('country')) {
          output[0]['country'] = item?.[`text_${options.locale}`] ?? item?.text;
        }
      });
    }

    return output;
  }
}
