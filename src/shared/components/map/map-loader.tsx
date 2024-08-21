import { useAppConfig } from '@/shared/hooks/use-app-config';
import dynamic from 'next/dynamic';
import { forwardRef, ReactElement } from 'react';

const maps = {
  mapbox: dynamic(() => import('./mapbox/map').then((mod) => mod.Map)),
};

type MapLoaderProps = {
  markers: {
    id: string;
    coordinates?: [number, number];
    popup?: ReactElement;
  }[];
};

const defaultCenter: [number, number] = [-120.740135, 47.751076];
const defaultZoom = 7;

const MapLoader = forwardRef<HTMLDivElement, MapLoaderProps>((props, ref) => {
  const appConfig = useAppConfig();
  const Map = maps[appConfig.adapters.map];

  return (
    <div ref={ref} id="map-container" className="h-full w-full">
      <div className="relative h-full w-full">
        <Map
          center={defaultCenter}
          zoom={defaultZoom}
          markers={props.markers}
        />
      </div>
    </div>
  );
});

MapLoader.displayName = 'MapLoader';

export { MapLoader };
