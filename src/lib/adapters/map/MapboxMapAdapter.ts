import { getPublicConfig } from '@/pages/api/config';
import axios from 'axios';
import router from 'next/router';
import { BaseMapAdapter, MapSearchResult } from './BaseMapAdapter';

export default class MapboxMapAdapter extends BaseMapAdapter {
  private _mapboxAccessToken = '';
  private _axios;

  constructor() {
    super();
    this._mapboxAccessToken = getPublicConfig('MAPBOX_ACCESS_TOKEN');
    this._axios = axios.create({
      baseURL: 'https://api.mapbox.com',
      params: {
        access_token: this._mapboxAccessToken,
        country: 'US',
      },
    });
  }

  async search(query): Promise<MapSearchResult[]> {
    const locale = router.locale;

    const res = await this._axios.get('/search/geocode/v6/forward', {
      params: {
        q: query,
        language: locale,
      },
    });

    return (
      res.data?.features?.map((feature) => ({
        address: feature?.properties?.full_address,
        coordinates:
          feature?.properties?.coordinates != null
            ? [
                feature?.properties?.coordinates?.longitude,
                feature?.properties?.coordinates?.latitude,
              ]
            : null,
      })) ?? []
    );
  }

  async reverseGeocode(coords): Promise<MapSearchResult> {
    const locale = router.locale;
    const coordinates = coords.split(',');

    const res = await this._axios.get('/search/geocode/v6/reverse', {
      params: {
        longitude: coordinates[0],
        latitude: coordinates[1],
        types: 'address',
        language: locale,
      },
    });

    const data = res.data?.features?.[0];

    if (!data) return null;

    return {
      address: data?.properties?.full_address,
      coordinates:
        data?.properties?.coordinates != null
          ? [
              data?.properties?.coordinates?.longitude,
              data?.properties?.coordinates?.latitude,
            ]
          : null,
    };
  }

  async forwardGeocode(address): Promise<MapSearchResult> {
    const locale = router.locale;

    const res = await this._axios.get('/search/geocode/v6/forward', {
      params: {
        q: address,
        language: locale,
        autocomplete: false,
      },
    });

    const data = res.data?.features?.[0];

    if (!data) return null;

    return {
      address: data?.properties?.full_address,
      coordinates:
        data?.properties?.coordinates != null
          ? [
              data?.properties?.coordinates?.longitude,
              data?.properties?.coordinates?.latitude,
            ]
          : null,
    };
  }
}
