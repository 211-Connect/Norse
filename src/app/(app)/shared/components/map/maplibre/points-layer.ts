import {
  type ExpressionSpecification,
  type GeoJSONSource,
  type Map as MapLibreMap,
} from 'maplibre-gl';

import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { type MarkerDef } from '../map-shared';

const SOURCE_ID = 'result-points';
const LAYER_ID = 'result-points-circles';
const COUNT_LAYER_ID = 'result-points-counts';

/** Circles grow to fit a count from here, so it's readable once it shows. */
const COUNT_MIN_ZOOM = 9;

/** Must exist on the style's glyph server, or the counts don't draw. */
const COUNT_FONT = 'DIN Pro Medium';

/** Extra reach around the cursor, because a circle is smaller than a fingertip. */
const HIT_TOLERANCE_PX = 8;

const IS_HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
];
const IN_LIST: ExpressionSpecification = ['boolean', ['get', 'inList'], false];
const ABOVE_OTHERS: ExpressionSpecification = ['case', IN_LIST, 1, 0];

export const toFeatureCollection = (
  points: MarkerDef[],
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: points
    .filter((point) => isValidCoordinate(point.coordinates))
    .map((point) => ({
      type: 'Feature',
      properties: {
        id: point.id,
        resources: point.count ?? 1,
        inList: !!point.inList,
      },
      geometry: { type: 'Point', coordinates: point.coordinates! },
    })),
});

/** A theme colour, in the comma form MapLibre's parser reads. */
const getThemeColor = (variable: string, fallback: string) => {
  const [hue, saturation, lightness] = getComputedStyle(
    document.documentElement,
  )
    .getPropertyValue(variable)
    .trim()
    .split(/\s+/);

  return lightness ? `hsl(${hue}, ${saturation}, ${lightness})` : fallback;
};

export const setPointsData = (map: MapLibreMap, points: MarkerDef[]) => {
  const data = toFeatureCollection(points);
  const source = map.getSource<GeoJSONSource>(SOURCE_ID);

  if (source) {
    source.setData(data);
    return;
  }

  const color = getThemeColor('--primary', '#2563eb');

  map.addSource(SOURCE_ID, { type: 'geojson', data, generateId: true });
  map.addLayer({
    id: LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    layout: { 'circle-sort-key': ABOVE_OTHERS },
    paint: {
      'circle-color': color,
      'circle-opacity': ['case', IN_LIST, 1, 0.5],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        ['case', IS_HOVERED, 7, 5],
        COUNT_MIN_ZOOM,
        ['case', IS_HOVERED, 11, 9],
        15,
        ['case', IS_HOVERED, 13, 11],
      ],
    },
  });
  map.addLayer({
    id: COUNT_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    minzoom: COUNT_MIN_ZOOM,
    filter: ['>', ['get', 'resources'], 1],
    layout: {
      'symbol-sort-key': ABOVE_OTHERS,
      'text-field': ['to-string', ['get', 'resources']],
      'text-font': [COUNT_FONT],
      'text-size': 11,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': [
        'case',
        IN_LIST,
        getThemeColor('--primary-foreground', '#ffffff'),
        '#ffffff',
      ],
    },
  });
};

export const removePointsLayer = (map: MapLibreMap) => {
  [COUNT_LAYER_ID, LAYER_ID].forEach((layer) => {
    if (map.getLayer(layer)) map.removeLayer(layer);
  });
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
