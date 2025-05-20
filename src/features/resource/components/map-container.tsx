'use client';
import { MapRenderer } from '@/shared/components/map/map-renderer';
import { Resource } from '@/types/resource';

type MapContainerProps = {
  resource: Resource;
};

export function MapContainer({ resource }: MapContainerProps) {
  return (
    <div className="h-[500px] max-h-64 w-full print:hidden">
      <MapRenderer
        markers={[
          {
            id: resource.id,
            coordinates: resource?.location?.coordinates,
          },
        ]}
        disableUserLocation
      />
    </div>
  );
}
