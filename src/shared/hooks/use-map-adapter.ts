import { useEffect, useRef } from 'react';
import { BaseMapAdapter } from '../adapters/map/base-map-adapter';
import { useAppConfig } from './use-app-config';

const adapterMapping = {
  mapbox: import('../adapters/map/mapbox-adapter').then(
    (mod) => mod.MapboxAdapter,
  ),
};

export function useMapAdapter() {
  const adapter = useRef<BaseMapAdapter>();
  const appConfig = useAppConfig();

  useEffect(() => {
    async function getAdapter() {
      const mapAdapter = await adapterMapping[appConfig.adapters.map];
      adapter.current = new mapAdapter();
    }

    getAdapter();
  }, [appConfig]);

  return adapter;
}
