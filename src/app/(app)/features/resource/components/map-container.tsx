import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { Resource } from '@/types/resource';

export function MapContainer({ resource }: { resource: Resource }) {
  const coordinates = resource?.location?.coordinates;

  // Check if coordinates are [0, 0]
  const isZeroCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates[0] === 0 &&
    coordinates[1] === 0;

  const hasValidPoint =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !isZeroCoordinates &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1]);

  const serviceArea = resource?.serviceArea; // Expecting a GeoJSON-like { type, coordinates }

  if (!(hasValidPoint && serviceArea)) {
    return null;
  }

  return (
    <div className="h-[500px] max-h-64 w-full print:hidden">
      <MapRenderer
        markers={
          hasValidPoint
            ? [
                {
                  id: resource.id,
                  coordinates: coordinates as [number, number],
                },
              ]
            : []
        }
        serviceArea={!hasValidPoint ? serviceArea : undefined}
        disableUserLocation
      />
    </div>
  );
}
