import { getPublicConfig } from '@/pages/api/config';
import axios from 'axios';
import { BaseMapAdapter } from './BaseMapAdapter';

export default class MapboxMapAdapter extends BaseMapAdapter {
  private _mapboxAccessToken = '';

  constructor() {
    super();
    this._mapboxAccessToken = getPublicConfig('MAPBOX_ACCESS_TOKEN');
  }

  async search(query, locale, sessionId) {
    const res = await axios.get(
      `https://api.mapbox.com/search/searchbox/v1/suggest?q=${query}&country=US&language=${locale}&access_token=${this._mapboxAccessToken}&session_token=${sessionId}`,
    );

    return res.data;
  }

  async retrieve(mapboxId, locale, sessionId) {
    const res = await axios.get(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?language=${locale}&access_token=${this._mapboxAccessToken}&session_token=${sessionId}`,
    );

    return res.data;
  }

  async reverseGeocode(coords, locale) {
    const res = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords}.json?access_token=${this._mapboxAccessToken}&types=address&country=US&language=${locale}`,
    );

    return res.data;
  }

  async forwardGeocode(address, locale) {
    const res = await axios.get(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${address}&language=${locale}&access_token=${this._mapboxAccessToken}`,
    );

    return res.data;
  }
}
