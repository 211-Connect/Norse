import {
  type ExpressionSpecification,
  type GeoJSONSource,
  type Map as MapLibreMap,
} from 'maplibre-gl';

import { isValidCoordinate } from '@/utils/isValidCoordinate';

import { type MarkerDef } from '../map-shared';

const SOURCE_ID = 'result-points';
const DOT_LAYER_ID = 'result-points-dots';
const BUBBLE_LAYER_ID = 'result-points-bubbles';
const COUNT_LAYER_ID = 'result-points-counts';

const CLUSTER_RADIUS_PX = 40;
const CLUSTER_MAX_ZOOM = 14;

/** Must exist on the style's glyph server, or the counts don't draw. */
const COUNT_FONT = 'DIN Pro Medium';

/** Extra reach around the cursor, because a circle is smaller than a fingertip. */
const HIT_TOLERANCE_PX = 8;

const IS_HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
];
const RESOURCES: ExpressionSpecification = ['get', 'resources'];

export const toFeatureCollection = (
  points: MarkerDef[],
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: points
    .filter((point) => isValidCoordinate(point.coordinates))
    .map((point, index) => ({
      type: 'Feature',
      // Clustered sources ignore generateId and drop an id of 0, and hover needs one.
      id: index + 1,
      properties: { id: point.id, resources: point.count ?? 1 },
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

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data,
    cluster: true,
    clusterRadius: CLUSTER_RADIUS_PX,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterProperties: { resources: ['+', RESOURCES] },
  });
  map.addLayer({
    id: DOT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', RESOURCES, 1],
    paint: {
      'circle-color': color,
      'circle-opacity': 0.7,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        ['case', IS_HOVERED, 5, 3],
        10,
        ['case', IS_HOVERED, 7, 5],
        15,
        ['case', IS_HOVERED, 10, 8],
      ],
    },
  });
  // A bubble is a cluster, or several resources at one address.
  map.addLayer({
    id: BUBBLE_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['>', RESOURCES, 1],
    paint: {
      'circle-color': color,
      'circle-opacity': 0.9,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['case', IS_HOVERED, 3, 2],
      'circle-radius': ['step', RESOURCES, 12, 10, 15, 100, 19],
    },
  });
  map.addLayer({
    id: COUNT_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['>', RESOURCES, 1],
    layout: {
      'text-field': ['to-string', RESOURCES],
      'text-font': [COUNT_FONT],
      'text-size': 12,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': getThemeColor('--primary-foreground', '#ffffff') },
  });
};

export const removePointsLayer = (map: MapLibreMap) => {
  [COUNT_LAYER_ID, BUBBLE_LAYER_ID, DOT_LAYER_ID].forEach((layer) => {
    if (map.getLayer(layer)) map.removeLayer(layer);
  });
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

const pointAt = (map: MapLibreMap, { x, y }: { x: number; y: number }) =>
  map.getLayer(DOT_LAYER_ID)
    ? map.queryRenderedFeatures(
        [
          [x - HIT_TOLERANCE_PX, y - HIT_TOLERANCE_PX],
          [x + HIT_TOLERANCE_PX, y + HIT_TOLERANCE_PX],
        ],
        { layers: [BUBBLE_LAYER_ID, DOT_LAYER_ID] },
      )[0]
    : undefined;

const zoomIntoCluster = (
  map: MapLibreMap,
  clusterId: number,
  center: [number, number],
) =>
  map
    .getSource<GeoJSONSource>(SOURCE_ID)
    ?.getClusterExpansionZoom(clusterId)
    .then((zoom) => map.easeTo({ center, zoom }))
    // The list's page can replace the clusters while this is waiting.
    .catch(() => undefined);

/** Hover and click for the circles and clusters. Returns the function that removes them. */
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

    const coordinates = feature.geometry.coordinates as [number, number];

    if (feature.properties.cluster) {
      zoomIntoCluster(map, feature.properties.cluster_id, coordinates);
    } else {
      onClick(feature.properties.id, coordinates);
    }
  };

  map.on('mousemove', handleMove);
  map.on('click', handleClick);

  return () => {
    map.off('mousemove', handleMove);
    map.off('click', handleClick);
    map.getCanvas().style.cursor = '';
  };
};
