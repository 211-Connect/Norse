import axios from 'axios';
import qs from 'qs';

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
export default function LocationAdapter() {
  return {
    search: async (query, locale, sessionId) => {
      const res = await axios.get(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${query}&country=US&language=${locale}&access_token=${MAPBOX_API_KEY}&session_token=${sessionId}`
      );

      return res.data;
    },
    retrieve: async (mapboxId, locale, sessionId) => {
      const res = await axios.get(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?language=${locale}&access_token=${MAPBOX_API_KEY}&session_token=${sessionId}`
      );

      return res.data;
    },
    reverseGeocode: async (coords, locale) => {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords}.json?access_token=${MAPBOX_API_KEY}&types=address&country=US&language=${locale}`
      );

      return res.data;
    },
    forwardGeocode: async (address, locale) => {
      const res = await axios.get(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${address}&language=${locale}&access_token=${MAPBOX_API_KEY}`
      );

      return res.data;
    },
  };
}
