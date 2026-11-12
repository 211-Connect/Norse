// Shared types
export type ServiceAreaGeoJSON = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: any;
};

export type MarkerDef = {
  id: string;
  coordinates?: [number, number];
  popup?: React.ReactElement;
  /** Builds `popup` when it opens, for markers too many to build every popup up front. */
  getPopup?: () => React.ReactElement;
  label?: string;
  /** Resources this marker stands for, when several share its location. */
  count?: number;
  /** Whether the list's current page shows this location. */
  inList?: boolean;
};

// Shared helpers

/** The content of a marker's popup, if it has one, built now if it's lazy. */
export const getPopupContent = (marker: MarkerDef) =>
  marker.popup ?? marker.getPopup?.();

export const hasPopup = (marker: MarkerDef) =>
  Boolean(marker.popup || marker.getPopup);

/** A location to the metre, so the resources of one address share it. */
export const toPlaceKey = (coordinates: [number, number]) =>
  `${coordinates[0].toFixed(5)},${coordinates[1].toFixed(5)}`;

/**
 * Identifies a set of locations without sorting them: their number and two
 * order-independent hashes of their places and counts. Cheap enough to run on
 * every change of 10,000 points.
 */
export const toPlacesSignature = (markers: MarkerDef[]) => {
  let sum = 0;
  let xor = 0;

  for (const marker of markers) {
    if (!marker.coordinates) continue;

    const text = `${toPlaceKey(marker.coordinates)}#${marker.count ?? 1}`;
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
      hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    }
    sum = (sum + hash) | 0;
    xor ^= hash;
  }

  return `${markers.length}:${sum}:${xor}`;
};

/** Share of locations left out at each edge when framing a map on where most of them are. */
const OUTLIER_SHARE_PER_EDGE = 0.025;

/** South-west and north-east corners around the central locations, if any. */
export function getCoreExtent(
  coordinates: [number, number][],
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  const skip = Math.floor(coordinates.length * OUTLIER_SHARE_PER_EDGE);
  const core = (axis: 0 | 1) => {
    const sorted = coordinates
      .map((coordinate) => coordinate[axis])
      .sort((a, b) => a - b);

    return [sorted[skip], sorted[sorted.length - 1 - skip]];
  };
  const [west, east] = core(0);
  const [south, north] = core(1);

  return [
    [west, south],
    [east, north],
  ];
}

export function normalizeServiceArea(
  sa: ServiceAreaGeoJSON | { type: 'GeometryCollection'; geometries: any[] },
) {
  if (!sa) return null;
  const closeRing = (ring: number[][]) => {
    if (ring.length >= 2) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
    }
    return ring;
  };

  if (sa.type === 'Polygon') {
    sa.coordinates = sa.coordinates.map(closeRing);
    return sa;
  } else if (sa.type === 'MultiPolygon') {
    sa.coordinates = sa.coordinates.map((poly) => poly.map(closeRing));
    return sa;
  } else if (sa.type === 'GeometryCollection' && Array.isArray(sa.geometries)) {
    sa.geometries.forEach((geom) => {
      if (geom.type === 'Polygon') {
        geom.coordinates = geom.coordinates.map(closeRing);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates = geom.coordinates.map((poly) => poly.map(closeRing));
      }
    });
    return sa;
  }
  return null;
}

export function getBoundsFromServiceArea(
  sa: ServiceAreaGeoJSON | { type: 'GeometryCollection'; geometries: any[] },
): [[number, number], [number, number]] | null {
  try {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const scan = ([x, y]) => {
      if (isNaN(x) || isNaN(y)) return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    if (sa.type === 'Polygon') {
      sa.coordinates.forEach((ring) => ring.forEach(scan));
    } else if (sa.type === 'MultiPolygon') {
      sa.coordinates.forEach((poly) =>
        poly.forEach((ring) => ring.forEach(scan)),
      );
    } else if (
      sa.type === 'GeometryCollection' &&
      Array.isArray(sa.geometries)
    ) {
      sa.geometries.forEach((geom) => {
        if (geom.type === 'Polygon') {
          geom.coordinates.forEach((ring) => ring.forEach(scan));
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly) =>
            poly.forEach((ring) => ring.forEach(scan)),
          );
        }
      });
    }

    if (
      minX === Infinity ||
      minY === Infinity ||
      maxX === -Infinity ||
      maxY === -Infinity
    )
      return null;
    return [
      [minX, minY],
      [maxX, maxY],
    ];
  } catch {
    return null;
  }
}
