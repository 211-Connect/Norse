import Radar from 'radar-sdk-js';
import RadarMap from 'radar-sdk-js/dist/ui/RadarMap';
import { useEffect, useState } from 'react';
import { MapContextProvider } from '../mapContext';
import 'radar-sdk-js/dist/radar.css';

export default function Map({
  children,
  publishableKey,
  zoom,
  center,
}: {
  children?: React.ReactNode;
  publishableKey: string;
  zoom?: number;
  center?: [number, number];
}) {
  const [map, setMap] = useState<RadarMap | undefined>();

  useEffect(() => {
    Radar.initialize(publishableKey);
    const _map = Radar.ui.map({
      container: 'map',
      style: 'radar-default-v1',
      zoom: zoom || 0,
      center,
    });
    setMap(_map);

    return () => {
      _map.remove();
      setMap(undefined);
    };
  }, [publishableKey, zoom, center]);

  return (
    <MapContextProvider value={{ map }}>
      <div id="map-container" className="aboslute h-full w-full">
        <div id="map" className="absolute h-full w-full">
          {children}
        </div>
      </div>
    </MapContextProvider>
  );
}
