import { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';

import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { type MarkerDef } from '../map-shared';

const SOURCE_ID = 'result-points';
const LAYER_ID = 'result-points-circles';

/** Extra reach around the cursor, because a circle is smaller than a fingertip. */
const HIT_TOLERANCE_PX = 8;

const toFeatureCollection = (
  points: MarkerDef[],
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: points
    .filter((point) => isValidCoordinate(point.coordinates))
    .map((point) => ({
      type: 'Feature',
      properties: { id: point.id },
      geometry: { type: 'Point', coordinates: point.coordinates! },
    })),
});

/** The tenant's brand colour, in the comma form MapLibre's parser reads. */
const getPointColor = () => {
  const [hue, saturation, lightness] = getComputedStyle(
    document.documentElement,
  )
    .getPropertyValue('--primary')
    .trim()
    .split(/\s+/);

  return lightness ? `hsl(${hue}, ${saturation}, ${lightness})` : '#2563eb';
};

export const setPointsData = (map: MapLibreMap, points: MarkerDef[]) => {
  const data = toFeatureCollection(points);
  const source = map.getSource<GeoJSONSource>(SOURCE_ID);

  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(SOURCE_ID, { type: 'geojson', data, generateId: true });
  map.addLayer({
    id: LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': getPointColor(),
      'circle-opacity': 0.7,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        ['case', ['boolean', ['feature-state', 'hover'], false], 5, 3],
        10,
        ['case', ['boolean', ['feature-state', 'hover'], false], 7, 5],
        15,
        ['case', ['boolean', ['feature-state', 'hover'], false], 10, 8],
      ],
    },
  });
};

export const removePointsLayer = (map: MapLibreMap) => {
  if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

const pointAt = (map: MapLibreMap, { x, y }: { x: number; y: number }) =>
  map.getLayer(LAYER_ID)
    ? map.queryRenderedFeatures(
        [
          [x - HIT_TOLERANCE_PX, y - HIT_TOLERANCE_PX],
          [x + HIT_TOLERANCE_PX, y + HIT_TOLERANCE_PX],
        ],
        { layers: [LAYER_ID] },
      )[0]
    : undefined;

/** Hover and click for the circles. Returns the function that removes them. */
export const bindPointEvents = (
  map: MapLibreMap,
  onClick: (id: string, coordinates: [number, number]) => void,
) => {
  let hoveredId: string | number | undefined;

  const setHovered = (id: string | number | undefined) => {
    if (id === hoveredId) return;

    const update = (featureId: string | number | undefined, hover: boolean) => {
      if (featureId !== undefined && map.getSource(SOURCE_ID)) {
        map.setFeatureState({ source: SOURCE_ID, id: featureId }, { hover });
      }
    };

    update(hoveredId, false);
    update(id, true);
    hoveredId = id;
    map.getCanvas().style.cursor = id === undefined ? '' : 'pointer';
  };

  const handleMove = (event: maplibregl.MapMouseEvent) =>
    setHovered(pointAt(map, event.point)?.id);

  const handleClick = (event: maplibregl.MapMouseEvent) => {
    const feature = pointAt(map, event.point);
    if (!feature || feature.geometry.type !== 'Point') return;

    onClick(
      feature.properties.id,
      feature.geometry.coordinates as [number, number],
    );
  };

  map.on('mousemove', handleMove);
  map.on('click', handleClick);

  return () => {
    map.off('mousemove', handleMove);
    map.off('click', handleClick);
    map.getCanvas().style.cursor = '';
  };
};
