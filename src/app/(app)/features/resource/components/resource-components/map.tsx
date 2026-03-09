'use client';

import { Resource } from '@/types/resource';
import { MapContainer } from '../map-container';

export function MapComponent({ resource }: { resource: Resource }) {
  return (
    <div className="overflow-hidden rounded-lg">
      <MapContainer resource={resource} />
    </div>
  );
}
