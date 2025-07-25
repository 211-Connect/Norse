import { MapRenderer } from '@/shared/components/map/map-renderer';

export function MapContainer({ resource }) {
  const coordinates = resource?.location?.coordinates;

  // Check if coordinates are [0, 0]
  const isZeroCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates[0] === 0 &&
    coordinates[1] === 0;

  if (!coordinates || isZeroCoordinates) {
    return null;
  }

  return (
    <div className="h-[500px] max-h-64 w-full print:hidden">
      <MapRenderer
        markers={[
          {
            id: resource.id,
            coordinates,
          },
        ]}
        disableUserLocation
      />
    </div>
  );
}
