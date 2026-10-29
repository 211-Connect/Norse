import {
  deriveQueryType,
  isEverywhereLocation,
} from '@/app/(app)/shared/lib/search-utils';
import { parseCommaSeparatedValues } from '@/app/(app)/shared/utils/parseCommaSeparatedValues';
import type { SearchEngine } from '@/types/appConfig';

import { ENVELOPE_KEYS, type SearchEnvelope } from './envelope';
import {
  UNSTATED,
  type IntentOf,
  type Slot,
  type SlotDeclarations,
  type Stated,
  type UrlPairs,
} from './slot';
import { SEARCH_SLOTS, type FiltersValue, type SearchIntent } from './slots';

const stated = <T>(value: T): Stated<T> => ({ stated: true, value });

const valueOf = <T>(slot: Slot<T>): T | undefined =>
  slot.stated ? slot.value : undefined;

type SlotValue<S> = S extends Stated<infer T> ? T : never;

/** An intent with the given slots stated (null and undefined leave a slot unstated). */
export function searchIntent(values: {
  [K in keyof SearchIntent]?: SlotValue<SearchIntent[K]> | null;
}): SearchIntent {
  return Object.fromEntries(
    Object.keys(SEARCH_SLOTS).map((name) => {
      const value = values[name as keyof SearchIntent];
      return [
        name,
        value === undefined || value === null ? UNSTATED : stated(value),
      ];
    }),
  ) as SearchIntent;
}

/** Each slot's URL parameters, in declaration order; an unstated slot writes none. */
export function encodeIntent<D extends SlotDeclarations>(
  declarations: D,
  intent: IntentOf<D>,
): Array<[keyof D & string, UrlPairs]> {
  return Object.entries(declarations).map(([name, declaration]) => {
    const slot = intent[name] as Slot<unknown>;
    return [name, slot.stated ? declaration.encode(slot.value) : []];
  });
}

/**
 * The query string for an intent and its envelope, without a leading `?`. Lossless: every stated slot
 * and marker is written as it stands, so lifting the result gives the same intent and envelope back. It
 * applies no rule; a writer applies `applyWriterRules` first.
 */
export function serializeSearch(
  intent: SearchIntent,
  envelope: SearchEnvelope,
): string {
  const pairs: Array<readonly [string, string]> = [];
  for (const [name, slotPairs] of encodeIntent(SEARCH_SLOTS, intent)) {
    pairs.push(...slotPairs);
    // The notify alert has always been written straight after the taxonomy.
    if (name === 'taxonomy' && envelope.a !== undefined)
      pairs.push(['a', envelope.a]);
  }
  for (const key of ENVELOPE_KEYS) {
    const value = envelope[key];
    if (key !== 'a' && value !== undefined) pairs.push([key, value]);
  }
  pairs.push(...envelope.passThrough);
  return new URLSearchParams(pairs as Array<[string, string]>).toString();
}

/** The `/search` URL for an intent and its envelope, under `basePath` (a locale prefix) when given. */
export function serializeSearchUrl(
  intent: SearchIntent,
  envelope: SearchEnvelope,
  basePath = '',
): string {
  const query = serializeSearch(intent, envelope);
  return `${basePath}/search${query ? `?${query}` : ''}`;
}

export type WriterOptions = { searchEngine: SearchEngine };

/**
 * Filters as a writer has always read them: every value iterated as a list (a value that is not one
 * throws, as it always has) and each item written as text.
 */
function writerFilters(
  filters: FiltersValue | undefined,
): Record<string, string[]> | undefined {
  if (!filters || Object.keys(filters).length === 0) return undefined;
  const out: Record<string, string[]> = {};
  Object.entries(filters).forEach(([key, values]) => {
    const written: string[] = [];
    (values as unknown[]).forEach((value) => written.push(String(value)));
    out[key] = written;
  });
  return out;
}

/**
 * The rules a search URL writer applies, and the only place they live:
 *
 * - `query_type` is always written: `taxonomy` when stated or when the query looks like codes, otherwise
 *   what the tenant's search engine searches with.
 * - The query, its label, the organization, the location and the distance are trimmed; empty is dropped.
 * - Taxonomy codes are split on commas, trimmed and de-duplicated.
 * - "Everywhere" is no location; coords are written only as a pair; distance only with a location or
 *   coords.
 * - A new search starts on the first page.
 *
 * Writers apply them before serializing. Re-serializing a lifted URL does not, so a URL is never
 * rewritten by being read and written back.
 */
export function applyWriterRules(
  intent: SearchIntent,
  envelope: SearchEnvelope,
  { searchEngine }: WriterOptions,
): { intent: SearchIntent; envelope: SearchEnvelope } {
  const trimmed = (slot: Slot<string>): Slot<string> => {
    const value = valueOf(slot)?.trim();
    return value ? stated(value) : UNSTATED;
  };
  const location = valueOf(intent.location)?.trim();
  const hasLocation = Boolean(location) && !isEverywhereLocation(location);
  const hasCoords = valueOf(intent.coords)?.length === 2;
  const taxonomy = parseCommaSeparatedValues(valueOf(intent.taxonomy));
  const aiOptions = valueOf(intent.aiOptions);
  const filters = writerFilters(valueOf(intent.filters));
  const { page, ...unpaged } = envelope;
  return {
    intent: {
      ...intent,
      query: trimmed(intent.query),
      queryLabel: trimmed(intent.queryLabel),
      queryType: stated(
        deriveQueryType({
          searchEngine,
          originQueryType: valueOf(intent.queryType),
          query: valueOf(intent.query),
        }),
      ),
      organizationId: trimmed(intent.organizationId),
      taxonomy: taxonomy ? stated(taxonomy) : UNSTATED,
      aiScenario: valueOf(intent.aiScenario) ? intent.aiScenario : UNSTATED,
      aiOptions:
        Array.isArray(aiOptions) && aiOptions.length > 0
          ? intent.aiOptions
          : UNSTATED,
      location: hasLocation ? stated(location!) : UNSTATED,
      coords: hasCoords ? intent.coords : UNSTATED,
      distance: hasLocation || hasCoords ? trimmed(intent.distance) : UNSTATED,
      filters: filters ? stated(filters) : UNSTATED,
    },
    envelope: unpaged,
  };
}
