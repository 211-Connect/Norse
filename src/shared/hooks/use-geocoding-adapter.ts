import { useEffect, useRef, useState } from 'react';
import { BaseGeocoderAdapter } from '../adapters/geocoder/base-geocoder-adapter';
import { useAppConfig } from './use-app-config';

const geocoders = {
  mapbox: import('../adapters/geocoder/mapbox-adapter').then(
    (mod) => mod.MapboxAdapter,
  ),
};

export function useGeocodingAdapter() {
  const [adapter, setAdapter] = useState<BaseGeocoderAdapter>();
  const appConfig = useAppConfig();

  useEffect(() => {
    async function getAdapter() {
      const adapterName = appConfig.adapters.geocoder;
      const Geocoder = await geocoders[adapterName];
      if (!Geocoder) {
        throw new Error(
          `The requested geocoder adapter '${adapterName}' is not available.`,
        );
      }
      setAdapter(new Geocoder());
    }

    getAdapter();
  }, [appConfig]);

  return adapter;
}
