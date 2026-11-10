import Color from 'color';
import {
  type ExpressionSpecification,
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
} from 'maplibre-gl';

import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { type MarkerDef, toPlaceKey, toPlacesSignature } from '../map-shared';

/** Every location of the search, light. Uploaded once per search, not per page. */
const ALL_SOURCE_ID = 'result-points';
/** The list's current page, dark, drawn above: about 25 locations, uploaded per page. */
const LIST_SOURCE_ID = 'result-points-list';

const ALL_LAYER_ID = 'result-points-circles';
const LIST_LAYER_ID = 'result-points-list-circles';
const ALL_COUNT_LAYER_ID = 'result-points-counts';
const LIST_COUNT_LAYER_ID = 'result-points-list-counts';

/** Counts show from here, where a circle (16px across) still holds two digits. */
const COUNT_MIN_ZOOM = 7;

/** A count hides only once a higher circle actually reaches its digits. */
const COUNT_COLLISION_PADDING_PX = 1;

/** Must exist on the style's glyph server, or the counts don't draw. */
const COUNT_FONT = 'DIN Pro Medium';

/** Extra reach around the cursor, because a circle is smaller than a fingertip. */
const HIT_TOLERANCE_PX = 8;

const IS_HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
];
const STACK: ExpressionSpecification = ['get', 'stack'];

export const toFeatureCollection = (
  points: MarkerDef[],
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: 'FeatureCollection',
  features: points
    .filter((point) => isValidCoordinate(point.coordinates))
    // Larger counts stack higher, so a shared address isn't buried under single
    // resources and its count wins the collision. The sort is stable, so equal
    // counts keep their order.
    .sort((a, b) => (a.count ?? 1) - (b.count ?? 1))
    .map((point, stack) => ({
      type: 'Feature',
      properties: {
        // By place, not by result: a shared address's first result changes with
        // the page, while the uploaded locations stay the same.
        key: toPlaceKey(point.coordinates!),
        resources: point.count ?? 1,
        stack,
      },
      geometry: { type: 'Point', coordinates: point.coordinates! },
    })),
});

/** The colour of a circle outside the list: the primary, halfway to white. */
export const toSubtleColor = (color: string) =>
  Color(color).mix(Color('#ffffff'), 0.5).hex();

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

const CIRCLE_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  ['case', IS_HOVERED, 8, 6],
  9,
  ['case', IS_HOVERED, 12, 10],
  15,
  ['case', IS_HOVERED, 14, 12],
];

const addCircleLayer = (
  map: MapLibreMap,
  id: string,
  source: string,
  color: string,
) =>
  map.addLayer({
    id,
    type: 'circle',
    source,
    layout: { 'circle-sort-key': STACK },
    paint: {
      'circle-color': color,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-radius': CIRCLE_RADIUS,
    },
  });

// A symbol layer always draws above the circles, so a count can't go behind a
// higher circle. Instead the counts collide, and the higher one keeps its place:
// the list's counts are placed first, being the upper layer. Single resources
// take part invisibly, because their circles cover counts too.
const addCountLayer = (
  map: MapLibreMap,
  id: string,
  source: string,
  color: string,
) =>
  map.addLayer({
    id,
    type: 'symbol',
    source,
    minzoom: COUNT_MIN_ZOOM,
    layout: {
      'symbol-sort-key': ['-', STACK],
      'text-field': ['to-string', ['get', 'resources']],
      'text-font': [COUNT_FONT],
      'text-size': 11,
      'text-padding': COUNT_COLLISION_PADDING_PX,
    },
    paint: {
      'text-opacity': ['case', ['>', ['get', 'resources'], 1], 1, 0],
      'text-color': color,
    },
  });

const uploaded = new WeakMap<MapLibreMap, string>();

/**
 * Draws every location light and the list's current page dark above it. A new
 * page re-uploads only its own locations: the rest are kept while they're the
 * same places, which turning the page doesn't change.
 */
export const setPointsData = (map: MapLibreMap, points: MarkerDef[]) => {
  const listData = toFeatureCollection(points.filter((point) => point.inList));
  const allSource = map.getSource<GeoJSONSource>(ALL_SOURCE_ID);
  const signature = toPlacesSignature(points);

  if (allSource) {
    if (uploaded.get(map) !== signature) {
      allSource.setData(toFeatureCollection(points));
      uploaded.set(map, signature);
    }
    map.getSource<GeoJSONSource>(LIST_SOURCE_ID)?.setData(listData);
    return;
  }

  const color = getThemeColor('--primary', '#2563eb');

  map.addSource(ALL_SOURCE_ID, {
    type: 'geojson',
    data: toFeatureCollection(points),
    generateId: true,
  });
  map.addSource(LIST_SOURCE_ID, {
    type: 'geojson',
    data: listData,
    generateId: true,
  });
  uploaded.set(map, signature);

  addCircleLayer(map, ALL_LAYER_ID, ALL_SOURCE_ID, toSubtleColor(color));
  addCircleLayer(map, LIST_LAYER_ID, LIST_SOURCE_ID, color);
  addCountLayer(map, ALL_COUNT_LAYER_ID, ALL_SOURCE_ID, '#ffffff');
  addCountLayer(
    map,
    LIST_COUNT_LAYER_ID,
    LIST_SOURCE_ID,
    getThemeColor('--primary-foreground', '#ffffff'),
  );
};

export const removePointsLayer = (map: MapLibreMap) => {
  [
    LIST_COUNT_LAYER_ID,
    ALL_COUNT_LAYER_ID,
    LIST_LAYER_ID,
    ALL_LAYER_ID,
  ].forEach((layer) => {
    if (map.getLayer(layer)) map.removeLayer(layer);
  });
  [LIST_SOURCE_ID, ALL_SOURCE_ID].forEach((source) => {
    if (map.getSource(source)) map.removeSource(source);
  });
  uploaded.delete(map);
};

/** The topmost circle under a point: the list's, where it covers another. */
const pointAt = (
  map: MapLibreMap,
  { x, y }: { x: number; y: number },
): MapGeoJSONFeature | undefined => {
  if (!map.getLayer(ALL_LAYER_ID)) return undefined;

  const features = map.queryRenderedFeatures(
    [
      [x - HIT_TOLERANCE_PX, y - HIT_TOLERANCE_PX],
      [x + HIT_TOLERANCE_PX, y + HIT_TOLERANCE_PX],
    ],
    { layers: [LIST_LAYER_ID, ALL_LAYER_ID] },
  );

  return (
    features.find((feature) => feature.layer.id === LIST_LAYER_ID) ??
    features[0]
  );
};

type Hovered = { source: string; id: string | number } | undefined;

/**
 * Hover and click for the circles. `onClick` gets the place key of the circle
 * clicked. Returns the function that removes them.
 */
export const bindPointEvents = (
  map: MapLibreMap,
  onClick: (placeKey: string, coordinates: [number, number]) => void,
) => {
  let hovered: Hovered;

  const setHovered = (next: Hovered) => {
    if (next?.source === hovered?.source && next?.id === hovered?.id) return;

    const update = (target: Hovered, hover: boolean) => {
      if (target && map.getSource(target.source)) {
        map.setFeatureState(target, { hover });
      }
    };

    update(hovered, false);
    update(next, true);
    hovered = next;
    map.getCanvas().style.cursor = next ? 'pointer' : '';
  };

  const handleMove = (event: maplibregl.MapMouseEvent) => {
    const feature = pointAt(map, event.point);
    setHovered(
      feature?.id !== undefined
        ? { source: feature.source, id: feature.id }
        : undefined,
    );
  };

  const handleClick = (event: maplibregl.MapMouseEvent) => {
    const feature = pointAt(map, event.point);
    if (!feature || feature.geometry.type !== 'Point') return;

    onClick(
      feature.properties.key,
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
