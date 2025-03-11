import { useAppConfig } from '@/shared/hooks/use-app-config';
import { userCoordinatesAtom } from '@/shared/store/search';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import { ReactElement } from 'react';

const maps = {
  mapbox: dynamic(() => import('./mapbox/map').then((mod) => mod.Map)),
};

type MapLoaderProps = {
  markers: {
    id: string;
    coordinates?: [number, number];
    popup?: ReactElement;
  }[];
  disableUserLocation?: boolean;
};

const MapLoader = (props: MapLoaderProps) => {
  const appConfig = useAppConfig();
  const Map = maps[appConfig.adapters.map];
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

export { MapLoader };
