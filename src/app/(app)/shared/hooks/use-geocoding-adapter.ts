'use client';

import { useEffect, useRef } from 'react';
import { BaseGeocoderAdapter } from '../adapters/geocoder/base-geocoder-adapter';
import { useAppConfig } from './use-app-config';

const geocoders = {
  mapbox: import('../adapters/geocoder/mapbox-adapter').then(
    (mod) => mod.MapboxAdapter,
  ),
};

export function useGeocodingAdapter() {
  const appConfig = useAppConfig();

  const adapter = useRef<BaseGeocoderAdapter>();

  useEffect(() => {
    async function getAdapter() {
      const adapterName = 'mapbox';

      const Geocoder = await geocoders[adapterName];
      if (!Geocoder) {
        throw new Error(
          `The requested geocoder adapter '${adapterName}' is not available.`,
        );
      }
      adapter.current = new Geocoder();
    }

    getAdapter();
  }, []);

  return adapter;
}
