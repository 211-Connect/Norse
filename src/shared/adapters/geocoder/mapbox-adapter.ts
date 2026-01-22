import { MAPBOX_API_KEY, MAPBOX_API_BASE_URL } from '@/shared/lib/constants';
import { BaseGeocoderAdapter } from './base-geocoder-adapter';
import axios from 'axios';

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
      // Extended fields
      id?: string;
      place_type?: string[];
      bbox?: [number, number, number, number];
      context?: { id: string; text: string }[];
    }[]
  > {
    const res = await axios.get(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${address}.json?access_token=${MAPBOX_API_KEY}&country=US&autocomplete=true&language=${options.locale}`,
    );

    let output = [];

    res?.data?.features?.forEach((feature) => {
      console.log('[MapboxAdapter] feature:', JSON.stringify(feature, null, 2));
      let obj = {
        type: 'coordinates',
        address:
          feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
        coordinates: feature?.['geometry']?.['coordinates'],
        // Capture extended fields
        id: feature?.id,
        place_type: feature?.place_type,
        bbox: feature?.bbox,
        context: feature?.context,
        // Existing context mapping logic below
      };

      // Add detailed location information to the output for analytics event tracking
      feature?.context?.forEach((item) => {
        const text = item?.[`text_${options.locale}`] ?? item?.text;
        
        if (item?.id?.startsWith('postcode')) {
          obj['postcode'] = text;
        } else if (item?.id?.startsWith('place')) {
          obj['place'] = text;
        } else if (item?.id?.startsWith('district')) {
          obj['district'] = text;
        } else if (item?.id?.startsWith('region')) {
          obj['region'] = text;
        } else if (item?.id?.startsWith('country')) {
          obj['country'] = text;
        }
      })
      
      output.push(obj);
    });

    return output;
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
    const res = await axios.get(
      `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${coords}.json?access_token=${MAPBOX_API_KEY}&types=address&country=US&language=${options.locale}`,
    );


    let output = res?.data?.features?.map((feature) => ({
      address:
        feature?.[`place_name_${options.locale}`] ?? feature?.['place_name'],
      coordinates: feature?.['geometry']?.['coordinates'],
    }))

    // Add detailed location information to the output for analytics event tracking
    res?.data?.features[0]?.context?.forEach((item) => {
      if (item?.id?.startsWith('postcode')) {
        output[0]['postcode'] = item?.[`text_${options.locale}`] ?? item?.text;
      } else if (item?.id?.startsWith('place')) {
        output[0]['place'] = item?.[`text_${options.locale}`] ?? item?.text;
      } else if (item?.id?.startsWith('district')) {
        output[0]['district'] = item?.[`text_${options.locale}`] ?? item?.text;
      } else if (item?.id?.startsWith('region')) {
        output[0]['region'] = item?.[`text_${options.locale}`] ?? item?.text;
      } else if (item?.id?.startsWith('country')) {
        output[0]['country'] = item?.[`text_${options.locale}`] ?? item?.text;
      }
    })

    return output;
  }
}
