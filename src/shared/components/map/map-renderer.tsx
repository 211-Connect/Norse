import { useAppConfig } from '@/shared/hooks/use-app-config';
import { userCoordinatesAtom } from '@/shared/store/search';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import { ReactElement } from 'react';

const renderers = {
  mapbox: dynamic(() => import('./mapbox/map').then((mod) => mod.Map)),
  maplibre: dynamic(() => import('./maplibre/map').then((mod) => mod.Map)),
};

type MapRendererProps = {
  markers: {
    id: string;
    coordinates?: [number, number];
    popup?: ReactElement;
  }[];
  disableUserLocation?: boolean;
};

const MapRenderer = (props: MapRendererProps) => {
  const appConfig = useAppConfig();
  const adapterName = appConfig.adapters.map;
  const Map = renderers[adapterName];
  if (!Map) {
    return (
      <div
        id="map-container"
        className="flex h-full w-full items-center justify-center"
      >
        <div className="rounded-md bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-medium text-red-600">
            Map Adapter Error
          </h3>
          <p className="text-gray-600">
            The requested map adapter '{adapterName}' is not available.
          </p>
        </div>
      </div>
    );
  }

  const userCoords = useAtomValue(userCoordinatesAtom);

  return (
    <div id="map-container" className="h-full w-full">
      <div className="relative h-full w-full">
        <Map
          center={appConfig.map.center}
          zoom={appConfig.map.zoom}
          markers={props.markers}
          usersLocation={userCoords}
          disableUserLocation={props.disableUserLocation}
        />
      </div>
    </div>
  );
};

export { MapRenderer };
