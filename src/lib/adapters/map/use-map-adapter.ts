import { useAppConfig } from '@/hooks/use-app-config';
import { useEffect, useRef } from 'react';
import { BaseMapAdapter } from './BaseMapAdapter';

const adapterMapping = {
  mapbox: import('./MapboxMapAdapter').then((mod) => mod.default),
  radar: import('./RadarMapAdapter').then((mod) => mod.default),
};

export default function useMapAdapter() {
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
