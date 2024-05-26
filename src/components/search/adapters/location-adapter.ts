import axios from 'axios';
import qs from 'qs';

export default function LocationAdapter() {
  return {
    searchLocations: async (query) => {
      const res = await axios.get(
        `/api/geocode?address=${query}&autocomplete=true`
      );

      return res.data;
    },
  };
}
