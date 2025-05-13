import { useEffect, useRef } from 'react';
import { BaseGeocoderAdapter } from '../adapters/geocoder/base-geocoder-adapter';
import { useAppConfig } from '@/lib/context/app-config-context';

const geocoders = {
  mapbox: import('../adapters/geocoder/mapbox-adapter').then(
    (mod) => mod.MapboxAdapter,
  ),
};

export function useGeocodingAdapter() {
  const adapter = useRef<BaseGeocoderAdapter>();
  const appConfig = useAppConfig();

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
  }, [appConfig]);

  return adapter;
}
