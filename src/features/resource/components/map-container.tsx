import { MapRenderer } from '@/shared/components/map/map-renderer';

export function MapContainer({ resource }) {
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
