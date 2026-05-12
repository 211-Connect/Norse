import { MapRenderer } from '@/app/(app)/shared/components/map/map-renderer';
import { Resource } from '@/types/resource';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

export function MapContainer({ resource }: { resource: Resource }) {
  const coordinates = resource?.location?.coordinates;

  const hasValidPoint = isValidCoordinate(coordinates);

  const serviceArea = resource?.serviceArea; // Expecting a GeoJSON-like { type, coordinates }

  if (!hasValidPoint && !serviceArea) {
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
        serviceArea={!hasValidPoint && serviceArea ? serviceArea : undefined}
        disableUserLocation
      />
    </div>
  );
}
