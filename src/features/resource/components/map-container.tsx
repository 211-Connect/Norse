import { MapLoader } from '@/shared/components/map/map-loader';

export function MapContainer({ resource }) {
  return (
    <div className="h-[500px] max-h-64 w-full print:hidden">
      <MapLoader
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
