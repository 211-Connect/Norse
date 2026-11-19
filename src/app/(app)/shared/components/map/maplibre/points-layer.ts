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
/** The hovered circle and the one whose popup is open, drawn larger above all. */
const ACTIVE_SOURCE_ID = 'result-points-active';

type Tone = 'subtle' | 'list' | 'active';

/** Each source's layers, bottom to top. */
const layerIds = (tone: Tone) => ({
  /** The circle behind a shared address, until its count shows. */
  stacks: `result-points-${tone}-stacks`,
  circles: `result-points-${tone}-circles`,
  /** Shared addresses with their count, from city level. */
  counts: `result-points-${tone}-counts`,
});

const SOURCES: Record<Tone, string> = {
  subtle: ALL_SOURCE_ID,
  list: LIST_SOURCE_ID,
  active: ACTIVE_SOURCE_ID,
};
const TONES: Tone[] = ['subtle', 'list', 'active'];

/** City level: from here a shared address shows its number of resources. */
const COUNTS_MIN_ZOOM = 10;
/** Counts above this read `99+`. */
const MAX_COUNT = 99;

/** A circle with a count grows to hold it: two digits, then `99+`. */
const COUNT_RADIUS_PX = 9;
const MAX_COUNT_RADIUS_PX = 11;

/** How much larger a circle is while hovered, and while its popup is open. */
const HOVER_GROWTH_PX = 2;
const SELECTED_GROWTH_PX = 3;

/** How far the circle behind a shared address sits, until its count shows. */
const STACK_OFFSET_PX = 1.5;

/** Extra reach around the cursor, because a circle is smaller than a fingertip. */
const HIT_TOLERANCE_PX = 8;

/** The list's white ring, and a light circle's primary ring once zoomed in. */
const LIST_RING_WIDTH_PX = 1.5;
const SUBTLE_RING_WIDTH_PX = 1;

/** Count digits: 10px in a 9px circle, smaller for `99+`. */
const COUNT_FONT_PX = 10;
const MAX_COUNT_FONT_PX = 8.5;

const IMAGE_PREFIX = 'result-point';

const STACK: ExpressionSpecification = ['get', 'stack'];
const RESOURCES: ExpressionSpecification = ['get', 'resources'];
const TONE: ExpressionSpecification = ['get', 'tone'];
const IS_SHARED: ExpressionSpecification = ['>', RESOURCES, 1];

/** Circle radius by zoom: small when zoomed out, so density shows instead of a blot. */
const BASE_RADIUS: [number, number][] = [
  [5, 3],
  [8, 4.5],
  [11, 7.5],
  [14, 10],
];

/**
 * Light circles are see-through when zoomed out, so where they overlap reads
 * darker, and solid from region level up.
 */
const SUBTLE_OPACITY: [number, number][] = [
  [5, 0.55],
  [9, 1],
];
const SOLID_OPACITY: [number, number][] = [[5, 1]];

/** A light circle's primary ring, thin while circles are tiny. */
const SUBTLE_RING_WIDTH: [number, number][] = [
  [5, 0.5],
  [8, SUBTLE_RING_WIDTH_PX],
];

/**
 * Zoom levels where a style's value is read. Just below the count threshold
 * too, so a circle grows the moment its count appears rather than over a whole
 * zoom level.
 */
const ZOOM_STOPS = [5, 8, 9, COUNTS_MIN_ZOOM - 0.01, COUNTS_MIN_ZOOM, 11, 14];

/** A piecewise-linear value at `zoom`, held flat past the ends. */
const valueAt = (stops: [number, number][], zoom: number) => {
  const after = stops.findIndex(([stop]) => stop >= zoom);
  if (after === 0) return stops[0][1];
  if (after === -1) return stops[stops.length - 1][1];

  const [z0, v0] = stops[after - 1];
  const [z1, v1] = stops[after];
  return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
};

/** A zoom curve whose value at each stop may depend on the feature. */
const byZoom = (
  valueAtZoom: (zoom: number) => ExpressionSpecification | number,
): ExpressionSpecification => [
  'interpolate',
  ['linear'],
  ['zoom'],
  ...ZOOM_STOPS.flatMap((zoom) => [zoom, valueAtZoom(zoom)]),
];

/** The radius a count's image is drawn at. */
const COUNT_IMAGE_RADIUS: ExpressionSpecification = [
  'case',
  ['>', RESOURCES, MAX_COUNT],
  MAX_COUNT_RADIUS_PX,
  COUNT_RADIUS_PX,
];

/** A circle's radius at `zoom`: large enough for its count, once shown. */
const radiusAt = (zoom: number): ExpressionSpecification | number =>
  zoom >= COUNTS_MIN_ZOOM
    ? [
        'max',
        valueAt(BASE_RADIUS, zoom),
        ['case', IS_SHARED, COUNT_IMAGE_RADIUS, 0],
      ]
    : valueAt(BASE_RADIUS, zoom);

/** The active source's circles grow: a little on hover, more while selected. */
const GROWTH: ExpressionSpecification = [
  'case',
  ['get', 'selected'],
  SELECTED_GROWTH_PX,
  HOVER_GROWTH_PX,
];

const toRadius = (tone: Tone) =>
  byZoom((zoom) =>
    tone === 'active' ? ['+', radiusAt(zoom), GROWTH] : radiusAt(zoom),
  );

/**
 * A count's image is drawn at its circle's radius at city level and scaled
 * only slightly from there (by at most 10/9), so its edge and digits stay sharp.
 */
const toCountIconSize = (tone: Tone) =>
  byZoom((zoom) =>
    zoom >= COUNTS_MIN_ZOOM
      ? [
          '/',
          tone === 'active' ? ['+', radiusAt(zoom), GROWTH] : radiusAt(zoom),
          COUNT_IMAGE_RADIUS,
        ]
      : 1,
  );

const COUNT_ICON_IMAGE: ExpressionSpecification = [
  'image',
  [
    'concat',
    IMAGE_PREFIX,
    '/',
    TONE,
    '/',
    ['case', ['>', RESOURCES, MAX_COUNT], 'many', ['to-string', RESOURCES]],
  ],
];

export const toFeatureCollection = (
  points: MarkerDef[],
  tone: Exclude<Tone, 'active'>,
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: 'FeatureCollection',
  features: points
    .filter((point) => isValidCoordinate(point.coordinates))
    // Larger counts stack higher, so a shared address isn't buried under single
    // resources. The sort is stable, so equal counts keep their order.
    .sort((a, b) => (a.count ?? 1) - (b.count ?? 1))
    .map((point, stack) => ({
      type: 'Feature',
      properties: {
        // By place, not by result: a shared address's first result changes with
        // the page, while the uploaded locations stay the same.
        key: toPlaceKey(point.coordinates!),
        resources: point.count ?? 1,
        stack,
        tone,
      },
      geometry: { type: 'Point', coordinates: point.coordinates! },
    })),
});

/** The colour of a circle outside the list: the primary, halfway to white. */
export const toSubtleColor = (color: string) =>
  Color(color).mix(Color('#ffffff'), 0.5).hex();

/**
 * A count's colour on a light circle: the primary, nearly halfway to black.
 * White reads about 2:1 there; this about 4.5:1 or better.
 */
export const toCountOnSubtleColor = (color: string) =>
  Color(color).mix(Color('#000000'), 0.45).hex();

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

type ToneStyle = {
  fill: string;
  ring: string;
  ringWidth: number;
  text: string;
};
type Palette = Record<Exclude<Tone, 'active'>, ToneStyle>;

const getPalette = (): Palette => {
  const primary = getThemeColor('--primary', '#2563eb');

  return {
    // The primary ring keeps a light circle visible on a light basemap.
    subtle: {
      fill: toSubtleColor(primary),
      ring: primary,
      ringWidth: SUBTLE_RING_WIDTH_PX,
      text: toCountOnSubtleColor(primary),
    },
    list: {
      fill: primary,
      ring: '#ffffff',
      ringWidth: LIST_RING_WIDTH_PX,
      text: getThemeColor('--primary-foreground', '#ffffff'),
    },
  };
};

/**
 * Draws a count's circle at the size it shows, at the screen's pixel density:
 * a ring outside the radius, as a circle layer draws its stroke, and the count
 * centred on its digits' own ink rather than the font's line box.
 */
const drawCountImage = (style: ToneStyle, kind: string) => {
  const isMany = kind === 'many';
  const radius = isMany ? MAX_COUNT_RADIUS_PX : COUNT_RADIUS_PX;
  const ratio = Math.min(3, Math.max(1, Math.ceil(window.devicePixelRatio)));
  // Room for the ring and a pixel of anti-aliasing on each side.
  const size = 2 * Math.ceil(radius + style.ringWidth + 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * ratio;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.scale(ratio, ratio);
  const center = size / 2;

  context.beginPath();
  context.arc(center, center, radius + style.ringWidth / 2, 0, 2 * Math.PI);
  context.fillStyle = style.fill;
  context.fill();
  context.lineWidth = style.ringWidth;
  context.strokeStyle = style.ring;
  context.stroke();

  const text = isMany ? `${MAX_COUNT}+` : kind;
  const fontFamily = getComputedStyle(document.body).fontFamily;
  context.font = `600 ${isMany ? MAX_COUNT_FONT_PX : COUNT_FONT_PX}px ${fontFamily}`;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillStyle = style.text;
  const metrics = context.measureText(text);
  const baseline =
    center +
    (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  context.fillText(text, center, baseline);

  return {
    image: context.getImageData(0, 0, canvas.width, canvas.height),
    pixelRatio: ratio,
  };
};

const palettes = new WeakMap<MapLibreMap, Palette>();

/** Draws each count's image the first time the map asks for it. */
const provideImages = (map: MapLibreMap) => {
  if (palettes.has(map)) return;
  palettes.set(map, getPalette());

  map.on('styleimagemissing', ({ id }: { id: string }) => {
    const [prefix, tone, kind] = id.split('/');
    const style = palettes.get(map)?.[tone as keyof Palette];
    if (prefix !== IMAGE_PREFIX || !style || !kind || map.hasImage(id)) return;

    const drawn = drawCountImage(style, kind);
    if (drawn) map.addImage(id, drawn.image, { pixelRatio: drawn.pixelRatio });
  });
};

/** A paint value per tone: the active source's circles keep their own tone's. */
const byTone = (tone: Tone, pick: (style: ToneStyle) => string) => {
  const palette = getPalette();
  return tone === 'active'
    ? (['match', TONE, 'list', pick(palette.list), pick(palette.subtle)] as
        ExpressionSpecification | string)
    : pick(palette[tone]);
};

const toRingWidth = (tone: Tone): ExpressionSpecification | number =>
  tone === 'list'
    ? LIST_RING_WIDTH_PX
    : tone === 'subtle'
      ? byZoom((zoom) => valueAt(SUBTLE_RING_WIDTH, zoom))
      : byZoom((zoom) => [
          'match',
          TONE,
          'list',
          LIST_RING_WIDTH_PX,
          valueAt(SUBTLE_RING_WIDTH, zoom),
        ]);

/**
 * Circles are drawn by the GPU at their own size, so their edges stay smooth
 * at every zoom. A shared address's circle hides from city level, where its
 * count image takes its place.
 */
const addCircleLayers = (map: MapLibreMap, tone: Tone) => {
  const ids = layerIds(tone);
  const source = SOURCES[tone];
  const opacity = tone === 'subtle' ? SUBTLE_OPACITY : SOLID_OPACITY;
  const circlePaint = {
    'circle-color': byTone(tone, (style) => style.fill),
    'circle-stroke-color': byTone(tone, (style) => style.ring),
    'circle-stroke-width': toRingWidth(tone),
    'circle-radius': toRadius(tone),
  };

  map.addLayer({
    id: ids.stacks,
    type: 'circle',
    source,
    filter: IS_SHARED,
    maxzoom: COUNTS_MIN_ZOOM,
    layout: { 'circle-sort-key': STACK },
    paint: {
      ...circlePaint,
      'circle-translate': [STACK_OFFSET_PX, STACK_OFFSET_PX],
      'circle-opacity': byZoom((zoom) => valueAt(opacity, zoom)),
      'circle-stroke-opacity': byZoom((zoom) => valueAt(opacity, zoom)),
    },
  });

  const circleOpacity = byZoom((zoom) =>
    zoom >= COUNTS_MIN_ZOOM
      ? ['case', IS_SHARED, 0, valueAt(opacity, zoom)]
      : valueAt(opacity, zoom),
  );
  map.addLayer({
    id: ids.circles,
    type: 'circle',
    source,
    layout: { 'circle-sort-key': STACK },
    paint: {
      ...circlePaint,
      'circle-opacity': circleOpacity,
      'circle-stroke-opacity': circleOpacity,
    },
  });

  // Above this tone's single circles, as larger counts stack higher anyway, and
  // below the next tone's, so a list circle covers a light count.
  map.addLayer({
    id: ids.counts,
    type: 'symbol',
    source,
    filter: IS_SHARED,
    minzoom: COUNTS_MIN_ZOOM,
    layout: {
      // Higher keys draw later, so on top.
      'symbol-sort-key': STACK,
      'icon-image': COUNT_ICON_IMAGE,
      'icon-size': toCountIconSize(tone),
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-padding': 0,
    },
  });
};

type Place = {
  coordinates: [number, number];
  resources: number;
  tone: Exclude<Tone, 'active'>;
};

const uploaded = new WeakMap<MapLibreMap, string>();
/** Every place on the map by key, to draw the one whose popup is open. */
const places = new WeakMap<MapLibreMap, Map<string, Place>>();

/**
 * Draws every location light and the list's current page dark above it. A new
 * page re-uploads only its own locations: the rest are kept while they're the
 * same places, which turning the page doesn't change.
 */
export const setPointsData = (map: MapLibreMap, points: MarkerDef[]) => {
  const listData = toFeatureCollection(
    points.filter((point) => point.inList),
    'list',
  );
  const allSource = map.getSource<GeoJSONSource>(ALL_SOURCE_ID);
  const signature = toPlacesSignature(points);

  places.set(
    map,
    new Map(
      points
        .filter((point) => isValidCoordinate(point.coordinates))
        .map((point) => [
          toPlaceKey(point.coordinates!),
          {
            coordinates: point.coordinates!,
            resources: point.count ?? 1,
            tone: point.inList ? 'list' : 'subtle',
          },
        ]),
    ),
  );

  if (allSource) {
    if (uploaded.get(map) !== signature) {
      allSource.setData(toFeatureCollection(points, 'subtle'));
      uploaded.set(map, signature);
    }
    map.getSource<GeoJSONSource>(LIST_SOURCE_ID)?.setData(listData);
    return;
  }

  provideImages(map);

  map.addSource(ALL_SOURCE_ID, {
    type: 'geojson',
    data: toFeatureCollection(points, 'subtle'),
  });
  map.addSource(LIST_SOURCE_ID, { type: 'geojson', data: listData });
  map.addSource(ACTIVE_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  uploaded.set(map, signature);

  TONES.forEach((tone) => addCircleLayers(map, tone));
};

/** The lowest result layer on the map, to draw an area under every circle; undefined before any. */
export const getLowestPointsLayerId = (map: MapLibreMap) =>
  TONES.map((tone) => layerIds(tone).stacks).find((id) => map.getLayer(id));

export const removePointsLayer = (map: MapLibreMap) => {
  [...TONES].reverse().forEach((tone) => {
    const ids = layerIds(tone);
    [ids.counts, ids.circles, ids.stacks].forEach((layer) => {
      if (map.getLayer(layer)) map.removeLayer(layer);
    });
    if (map.getSource(SOURCES[tone])) map.removeSource(SOURCES[tone]);
  });
  uploaded.delete(map);
  places.delete(map);
  active.delete(map);
};

const HIT_LAYERS = [layerIds('list').circles, layerIds('subtle').circles];

/**
 * What the map shows now, for tests to read from the page (the canvas has no
 * DOM): the places drawn in view and how many of them show their count.
 */
export const describeShownPoints = (map: MapLibreMap) => {
  if (!map.style || !map.getLayer(HIT_LAYERS[1])) {
    return { places: 0, counts: 0 };
  }

  // A shared address's circle is still there, transparent, under its count.
  const shown = map.queryRenderedFeatures({ layers: HIT_LAYERS });
  const keys = (keep: (feature: MapGeoJSONFeature) => boolean) =>
    new Set(shown.filter(keep).map((feature) => feature.properties.key)).size;

  return {
    places: keys(() => true),
    counts:
      map.getZoom() >= COUNTS_MIN_ZOOM
        ? keys((feature) => feature.properties.resources > 1)
        : 0,
  };
};

type ActivePlace = Place & { key: string };

/** The hovered circle and the one whose popup is open, per map. */
const active = new WeakMap<
  MapLibreMap,
  { hovered?: ActivePlace; selected?: ActivePlace }
>();

/** Draws the hovered and selected circles above all others, larger. */
const drawActive = (
  map: MapLibreMap,
  next: { hovered?: ActivePlace; selected?: ActivePlace },
) => {
  active.set(map, next);

  const features = (['hovered', 'selected'] as const).flatMap(
    (state, stack) => {
      const place = next[state];
      if (!place) return [];

      return [
        {
          type: 'Feature' as const,
          properties: {
            key: place.key,
            resources: place.resources,
            tone: place.tone,
            selected: state === 'selected',
            stack,
          },
          geometry: { type: 'Point' as const, coordinates: place.coordinates },
        },
      ];
    },
  );

  map
    .getSource<GeoJSONSource>(ACTIVE_SOURCE_ID)
    ?.setData({ type: 'FeatureCollection', features });
};

/**
 * Marks the circle whose popup is open, larger and on top of everything.
 * `null` clears it.
 */
export const setSelectedPlace = (map: MapLibreMap, placeKey: string | null) => {
  // A removed map has no style, and its open popup closes after that, calling
  // here: there is nothing left to mark.
  if (!map.style) {
    active.delete(map);
    return;
  }

  const current = active.get(map) ?? {};
  if ((current.selected?.key ?? null) === placeKey) return;

  const place = placeKey ? places.get(map)?.get(placeKey) : undefined;
  drawActive(map, {
    ...current,
    selected: place && placeKey ? { ...place, key: placeKey } : undefined,
  });
};

/** The topmost circle under a point: the list's, where it covers another. */
const pointAt = (
  map: MapLibreMap,
  { x, y }: { x: number; y: number },
): MapGeoJSONFeature | undefined => {
  if (!map.getLayer(HIT_LAYERS[1])) return undefined;

  const features = map.queryRenderedFeatures(
    [
      [x - HIT_TOLERANCE_PX, y - HIT_TOLERANCE_PX],
      [x + HIT_TOLERANCE_PX, y + HIT_TOLERANCE_PX],
    ],
    { layers: HIT_LAYERS },
  );

  return (
    features.find((feature) => feature.layer.id === HIT_LAYERS[0]) ??
    features[0]
  );
};

/**
 * Hover and click for the circles. `onClick` gets the place key of the circle
 * clicked. Returns the function that removes them.
 */
export const bindPointEvents = (
  map: MapLibreMap,
  onClick: (placeKey: string, coordinates: [number, number]) => void,
) => {
  const setHovered = (feature: MapGeoJSONFeature | undefined) => {
    const current = active.get(map) ?? {};
    const key: string | undefined = feature?.properties.key;
    if (current.hovered?.key === key) return;

    drawActive(map, {
      ...current,
      hovered:
        feature && key && feature.geometry.type === 'Point'
          ? {
              key,
              coordinates: feature.geometry.coordinates as [number, number],
              resources: feature.properties.resources,
              tone: feature.properties.tone,
            }
          : undefined,
    });
    map.getCanvas().style.cursor = feature ? 'pointer' : '';
  };

  const handleMove = (event: maplibregl.MapMouseEvent) => {
    setHovered(pointAt(map, event.point));
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
