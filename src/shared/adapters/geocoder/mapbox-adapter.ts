import { MAPBOX_API_KEY, MAPBOX_API_BASE_URL } from '@/shared/lib/constants';
import { BaseGeocoderAdapter } from './base-geocoder-adapter';

interface MapboxFeature {
  place_name: string;
  geometry: { coordinates: [number, number] };
  context?: Array<{ id: string; text: string; [key: string]: any }>;
  [key: string]: any;
}

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
    // Always encode user input to prevent URL injection or errors with special chars
    const encodedAddress = encodeURIComponent(address);

    //Build URL using URLSearchParams for reliability
    const params = new URLSearchParams({
      access_token: MAPBOX_API_KEY,
      country: 'US',
      autocomplete: 'true',
      language: options.locale,
    });

    const url = `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${encodedAddress}.json?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        // CACHING STRATEGY
        // 'force-cache' checks the Data Cache first.
        // revalidate: 3600 = Cache for 1 hour (3600 seconds).
        // Mapbox ToS generally allows temporary caching.
        cache: 'force-cache',
        next: {
          revalidate: 3600,
          tags: ['mapbox-forward-geocoding'], // Optional: Allows you to manually purge cache later
        },
      });

      if (!res.ok) {
        throw new Error(`Mapbox API Error: ${res.statusText}`);
      }

      const data = await res.json();

      return this.transformForwardResponse(data, options.locale);
    } catch (error) {
      console.error('Geocoding error:', error);
      return []; // Return empty or handle error gracefully
    }
  }

  async reverseGeocode(
    coords: string, // Ensure format is "longitude,latitude"
    options: { locale: string },
  ) {
    // Encode coordinates just in case, though usually safe
    const encodedCoords = encodeURIComponent(coords);

    const params = new URLSearchParams({
      access_token: MAPBOX_API_KEY,
      types: 'address',
      country: 'US',
      language: options.locale,
    });

    const url = `${MAPBOX_API_BASE_URL}/geocoding/v5/mapbox.places/${encodedCoords}.json?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'force-cache',
        next: { revalidate: 3600, tags: ['mapbox-reverse-geocoding'] }, // Cache reverse geocoding as well
      });

      if (!res.ok) throw new Error('Mapbox Reverse Geocoding Failed');

      const data = await res.json();

      return this.transformReverseResponse(data, options.locale);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Helper to keep the main logic clean (same logic as your original code)
  private transformForwardResponse(data: any, locale: string) {
    return (data.features || []).map((feature: MapboxFeature) => {
      const obj: any = {
        type: 'coordinates',
        address: feature[`place_name_${locale}`] || feature.place_name,
        coordinates: feature.geometry?.coordinates,
      };

      this.extractContext(feature, obj, locale);
      return obj;
    });
  }

  private transformReverseResponse(data: any, locale: string) {
    if (!data.features?.length) return [];

    const output = data.features.map((feature: MapboxFeature) => ({
      address: feature[`place_name_${locale}`] || feature.place_name,
      coordinates: feature.geometry?.coordinates,
    }));

    // Logic for adding context to the first item (as per your original code)
    if (data.features[0]) {
      this.extractContext(data.features[0], output[0], locale);
    }

    return output;
  }

  private extractContext(
    feature: MapboxFeature,
    targetObj: any,
    locale: string,
  ) {
    feature.context?.forEach((item) => {
      const text = item[`text_${locale}`] || item.text;
      if (item.id.startsWith('postcode')) targetObj.postcode = text;
      else if (item.id.startsWith('place')) targetObj.place = text;
      else if (item.id.startsWith('district')) targetObj.district = text;
      else if (item.id.startsWith('region')) targetObj.region = text;
      else if (item.id.startsWith('country')) targetObj.country = text;
    });
  }
}
