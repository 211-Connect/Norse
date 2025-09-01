// Shared types
export type ServiceAreaGeoJSON = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: any;
};

export type MarkerDef = {
  id: string;
  coordinates?: [number, number];
  popup?: React.ReactElement;
};

// Shared helpers
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
