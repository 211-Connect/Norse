/**
 * The region picker's model (docs/landing-pages.md, Regions): a state's
 * counties and places from Norse-API grouped into a tree, and the stored
 * selection, an explicit list of regions. Pure; the admin picker uses it.
 */

import type { SelectedRegion } from './plan';
import { STATE_NAMES } from './slugs';

/** A county or place as Norse-API `GET /regions` lists it. */
export type CatalogRegion = {
  id: string;
  type: 'county' | 'place';
  name: string;
  state: string;
  county_id?: string | null;
};

/** A selected state also remembers the ids the picker showed it, to spot new ones. */
export type StoredRegion = SelectedRegion & { seen?: string[] };

export type CountyNode = { county: CatalogRegion; cities: CatalogRegion[] };

export type RegionTree = {
  counties: CountyNode[];
  /** Places whose centroid is in no county of the index. */
  otherCities: CatalogRegion[];
};

const byName = (a: CatalogRegion, b: CatalogRegion) =>
  a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
  a.id.localeCompare(b.id);

export function buildRegionTree(items: readonly CatalogRegion[]): RegionTree {
  const counties = items.filter((r) => r.type === 'county').sort(byName);
  const countyIds = new Set(counties.map((c) => c.id));
  const citiesByCounty = new Map<string, CatalogRegion[]>();
  const otherCities: CatalogRegion[] = [];
  for (const place of items.filter((r) => r.type === 'place').sort(byName)) {
    if (place.county_id && countyIds.has(place.county_id)) {
      const list = citiesByCounty.get(place.county_id) ?? [];
      list.push(place);
      citiesByCounty.set(place.county_id, list);
    } else {
      otherCities.push(place);
    }
  }
  return {
    counties: counties.map((county) => ({
      county,
      cities: citiesByCounty.get(county.id) ?? [],
    })),
    otherCities,
  };
}

export const stateEntry = (state: string, seen?: string[]): StoredRegion => ({
  id: `state:${state}`,
  type: 'state',
  name: STATE_NAMES[state] ?? state,
  state,
  ...(seen ? { seen } : {}),
});

/** States in the selection, in the order they were added. */
export function selectedStates(selection: readonly StoredRegion[]): string[] {
  return selection.filter((r) => r.type === 'state').map((r) => r.state);
}

/** Ids of the state's counties and places that are selected. */
export function selectedIds(
  selection: readonly StoredRegion[],
  state: string,
): Set<string> {
  return new Set(
    selection
      .filter((r) => r.state === state && r.type !== 'state')
      .map((r) => r.id),
  );
}

/**
 * Places the index has now that the picker had not shown when the state was
 * last edited. Empty when the state has never been edited with the catalog.
 */
export function newPlaces(
  selection: readonly StoredRegion[],
  state: string,
  items: readonly CatalogRegion[],
): CatalogRegion[] {
  const entry = selection.find((r) => r.id === `state:${state}`);
  if (!entry?.seen) return [];
  const seen = new Set(entry.seen);
  return items.filter((r) => r.type === 'place' && !seen.has(r.id));
}

/**
 * The selection with `state`'s counties and places replaced by `ids`, each
 * with its name, type and county copied in, and the state marked as having
 * seen every region of `items`.
 */
export function withStateSelection(
  selection: readonly StoredRegion[],
  state: string,
  ids: ReadonlySet<string>,
  items: readonly CatalogRegion[],
): StoredRegion[] {
  const others = selection.filter((r) => r.state !== state);
  const chosen: StoredRegion[] = items
    .filter((r) => ids.has(r.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      state: r.state,
      ...(r.type === 'place' ? { countyId: r.county_id ?? null } : {}),
    }));
  // A selected region the index no longer has stays selected: its pages
  // only retire when someone unticks it.
  const missing = selection.filter(
    (r) =>
      r.state === state &&
      r.type !== 'state' &&
      ids.has(r.id) &&
      !items.some((i) => i.id === r.id),
  );
  return [
    ...others,
    stateEntry(state, items.map((r) => r.id).sort()),
    ...chosen,
    ...missing,
  ];
}

export function withoutState(
  selection: readonly StoredRegion[],
  state: string,
): StoredRegion[] {
  return selection.filter((r) => r.state !== state);
}
