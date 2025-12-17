'use client';

import { useEffect, useState } from 'react';
import { BaseGeocoderAdapter } from '../adapters/geocoder/base-geocoder-adapter';

const geocoders = {
  mapbox: import('../adapters/geocoder/mapbox-adapter').then(
    (mod) => mod.MapboxAdapter,
  ),
};

export function useGeocodingAdapter() {
  const [adapter, setAdapter] = useState<BaseGeocoderAdapter>();

  useEffect(() => {
    async function getAdapter() {
      const adapterName = 'mapbox';

      const Geocoder = await geocoders[adapterName];
      if (!Geocoder) {
        throw new Error(
          `The requested geocoder adapter '${adapterName}' is not available.`,
        );
      }
      setAdapter(new Geocoder());
    }

    getAdapter();
  }, []);

  return adapter;
}
