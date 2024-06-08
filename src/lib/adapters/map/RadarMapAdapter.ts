import { getPublicConfig } from '@/pages/api/config';
import { BaseMapAdapter, MapSearchResult } from './BaseMapAdapter';
import axios from 'axios';

export default class RadarMapAdapter extends BaseMapAdapter {
  private _radarMapAccessToken = '';
  private _baseUrl = 'https://api.radar.io/v1';
  private _axios;

  constructor() {
    super();
    this._radarMapAccessToken = getPublicConfig('RADAR_ACCESS_TOKEN');
    this._axios = axios.create({
      baseURL: this._baseUrl,
      headers: {
        Authorization: this._radarMapAccessToken,
      },
      params: {
        country: 'US',
      },
    });
  }

  async search(query: string): Promise<MapSearchResult[]> {
    const res = await this._axios.get(`/search/autocomplete`, {
      params: {
        query,
      },
    });

    return (
      res?.data?.addresses?.map((address) => ({
        address: address.formattedAddress,
        coordinates: address?.geometry?.coordinates,
      })) ?? []
    );
  }

  async reverseGeocode(coords: string): Promise<MapSearchResult> {
    const reverseCoords = coords.split(',').reverse().join(',');
    const res = await this._axios.get('/geocode/reverse', {
      params: {
        coordinates: reverseCoords,
      },
    });
    const data = res.data?.addresses?.[0];

    if (!data) return null;

    return {
      address: data.formattedAddress,
      coordinates: data?.geometry?.coordinates,
    };
  }

  async forwardGeocode(address: string): Promise<MapSearchResult> {
    const res = await this._axios.get('/geocode/forward', {
      params: {
        query: address,
      },
    });
    const data = res.data?.addresses?.[0];

    if (!data) return null;

    return {
      address: data.formattedAddress,
      coordinates: data?.geometry?.coordinates,
    };
  }
}
