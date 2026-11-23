/**
 * The tenant's area search settings (Payload: `areaMatchMode`, `unlocatedInAreaSearch`), sent with
 * every area search (`region`). One source for v1 (`search/page.tsx`) and the v2 calls, so the two
 * versions read the same setting the same way. No React and no server-only imports.
 *
 * A value that is not a known one is left out: Norse-API then applies its own default for the
 * tenant, as for any caller that sends none.
 */
import {
  isAreaMatch,
  UNLOCATED_VALUES,
  type AreaMatch,
  type Unlocated,
} from '@/types/areaSearch';

export type AreaSettingsSource = {
  areaMatch?: unknown;
  unlocatedInAreaSearch?: unknown;
};

const isUnlocated = (value: unknown): value is Unlocated =>
  (UNLOCATED_VALUES as readonly unknown[]).includes(value);

export function areaSettingsOf(search: AreaSettingsSource | null | undefined): {
  areaMatch?: AreaMatch;
  unlocated?: Unlocated;
} {
  const settings: { areaMatch?: AreaMatch; unlocated?: Unlocated } = {};
  if (isAreaMatch(search?.areaMatch)) settings.areaMatch = search.areaMatch;
  if (isUnlocated(search?.unlocatedInAreaSearch)) {
    settings.unlocated = search.unlocatedInAreaSearch;
  }
  return settings;
}

/**
 * Adds `area_match` and `unlocated` to the outgoing v2 parameters of an area search (`region`).
 * A value the caller already sent wins, as on Norse-API. A search without `region` is not an area
 * search and gets nothing.
 */
export function addAreaSettings(
  outgoing: URLSearchParams,
  search: AreaSettingsSource | null | undefined,
): void {
  if (!outgoing.get('region')) return;
  const { areaMatch, unlocated } = areaSettingsOf(search);
  if (areaMatch && !outgoing.has('area_match'))
    outgoing.set('area_match', areaMatch);
  if (unlocated && !outgoing.has('unlocated'))
    outgoing.set('unlocated', unlocated);
}
