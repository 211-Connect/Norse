/**
 * Prototype: the Norse-API `GET /v2/search/pins` request and answer (Norse-API PR #330). No React
 * and no server-only imports, so the unit tests can import it.
 *
 * Path only (ADR 0039): no `x-api-version` header. Tenant and language go in the URL, as for
 * `GET /v2/search` (PR #331). The map must show the same set as the list, so the pins call sends
 * every result-changing parameter of the list call. It leaves out what pins ignore or what only
 * shapes one list page: `page`, `passed_needs`, `urgency`, `clarify`, `classify`.
 */

/** Plain page-URL keys that change the result set. `filters[...]` keys are matched by their root. */
export const PINS_FORWARD = [
  'query',
  'other',
  'needs',
  'taxonomy',
  'location',
  'coords',
  'distance',
  'region',
  'area_match',
  'unlocated',
  'age',
  'relevance_cutoff',
] as const;

const FILTER_ROOT = 'filters';

const rootOf = (key: string) => key.split('[')[0];

/** The result-changing parameters of a page URL, in a stable order (the query cache key). */
export function pinsCallString(
  params: Pick<URLSearchParams, 'entries'>,
): string {
  const picked: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    if (!value) continue;
    if (
      (PINS_FORWARD as readonly string[]).includes(key) ||
      rootOf(key) === FILTER_ROOT
    ) {
      picked.push([key, value]);
    }
  }
  picked.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return new URLSearchParams(picked).toString();
}

import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';

import {
  addAreaSettings,
  type AreaSettingsSource,
} from '../utils/area-settings';

import type { SearchPin } from '../utils/map-pins';

export const DEFAULT_LOCALE = 'en';

/** The upstream URL: the forwarded parameters, then `tenant_id` and `locale` (always both). */
export function buildPinsUrl(
  apiUrl: string,
  incoming: Pick<URLSearchParams, 'entries' | 'get'>,
  tenantId: string,
  /** The tenant's Payload area settings: the pins and the list send the same ones. */
  areaSettings?: AreaSettingsSource | null,
): string {
  const outgoing = new URLSearchParams(pinsCallString(incoming));
  addAreaSettings(outgoing, areaSettings);
  outgoing.set('tenant_id', tenantId);
  outgoing.set('locale', incoming.get('locale') || DEFAULT_LOCALE);
  return `${apiUrl}/v2/search/pins?${outgoing}`;
}

export type V2Pin = {
  id: string;
  service_at_location_id: string | null;
  name: string | null;
  physical_address: Record<string, string | null | undefined> | null;
  /** Longitude, latitude. */
  coordinates: [number, number];
};

export type V2PinsResponse = {
  total: number;
  truncated: boolean;
  pins: V2Pin[];
};

const isCoordinate = (c: unknown): c is [number, number] =>
  Array.isArray(c) &&
  c.length === 2 &&
  c.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Keeps the pins that can be drawn: an id and a longitude, latitude pair. */
export function usablePins(
  response: Partial<V2PinsResponse> | null | undefined,
): V2Pin[] {
  const pins = Array.isArray(response?.pins) ? response.pins : [];
  return pins.filter(
    (p) => p && typeof p.id === 'string' && isCoordinate(p.coordinates),
  );
}

/**
 * A v2 pin as the v1 map pins (`SearchPin`): the map groups, dedupes and draws both with the same
 * code. The card link is the service-at-location id; the address is the pin's own physical address.
 */
export function toSearchPins(
  response: Partial<V2PinsResponse> | null | undefined,
): SearchPin[] {
  return usablePins(response).map((pin) => ({
    id: pin.id,
    resourceId: pin.service_at_location_id ?? pin.id,
    name: pin.name,
    address: formatAddressForDisplay(pin.physical_address),
    coordinates: pin.coordinates,
  }));
}

/**
 * Pure: whether the map asks `/v2/search/pins`. The tenant's showAllResultsOnMap setting decides
 * (Lucas 2026-11-20): off = the map shows only the list's current page.
 */
export function pinsCallEnabled({
  query,
  tenantId,
  showAllResultsOnMap,
}: {
  query: string;
  tenantId: string | undefined;
  showAllResultsOnMap: boolean;
}): boolean {
  return Boolean(query && tenantId && showAllResultsOnMap);
}
