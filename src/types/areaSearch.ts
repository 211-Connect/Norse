/**
 * How an area search (`region` on Norse API GET /search) decides a resource is
 * in the area. See docs/area-search.md.
 */
export const AREA_MATCH_VALUES = [
  'located',
  'located_or_serving',
  'serving',
] as const;
export type AreaMatch = (typeof AREA_MATCH_VALUES)[number];

export const DEFAULT_AREA_MATCH: AreaMatch = 'located_or_serving';

export const isAreaMatch = (value: unknown): value is AreaMatch =>
  (AREA_MATCH_VALUES as readonly unknown[]).includes(value);

/** `state:WA`, `county:53033`, `place:5363000` or `zip:98101`. */
export const REGION_ID_PATTERN =
  /^(state:[A-Z]{2}|county:\d{5}|place:\d{7}|zip:\d{5})$/;

export const isRegionId = (value: unknown): value is string =>
  typeof value === 'string' && REGION_ID_PATTERN.test(value);
