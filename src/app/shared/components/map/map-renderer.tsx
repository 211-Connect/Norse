'use client';

import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { userCoordinatesAtom } from '@/app/shared/store/search';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';

const renderers = {
  mapbox: dynamic(() => import('./mapbox/map').then((mod) => mod.Map)),
  maplibre: dynamic(() => import('./maplibre/map').then((mod) => mod.Map)),
};

export interface MarkerDef {
  id: string;
  coordinates?: [number, number];
  popup?: any;
}

export interface ServiceAreaGeoJSON {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: any; // Keep broad; underlying map lib validates
}

type MapRendererProps = {
  markers?: MarkerDef[]; // made optional; component will default to []
  serviceArea?: ServiceAreaGeoJSON;
  usersLocation?: [number, number];
  disableUserLocation?: boolean;
  center?: [number, number];
  zoom?: number;
};

const MapRenderer = (props: MapRendererProps) => {
  const appConfig = useAppConfig();
  const adapterName = appConfig?.adapters.map ?? '';
  const Map = renderers[adapterName];
  const userCoords = useAtomValue(userCoordinatesAtom);

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
            The requested map adapter &apos;{adapterName}&apos; is not
            available.
          </p>
        </div>
      </div>
    );
  }

  const markers = props.markers ?? [];
  return (
    <div id="map-container" className="h-full w-full">
      <div className="relative h-full w-full">
        <Map
          center={appConfig?.map.center}
          zoom={appConfig?.map.zoom}
          markers={markers}
          serviceArea={props.serviceArea}
          usersLocation={userCoords}
          disableUserLocation={props.disableUserLocation}
        />
      </div>
    </div>
  );
};

export { MapRenderer };
