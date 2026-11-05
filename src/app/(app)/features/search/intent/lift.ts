import qs from 'qs';

import { ENVELOPE_KEYS, readEnvelope, type SearchEnvelope } from './envelope';
import {
  matchGenerations,
  modifiersOf,
  type Generation,
  type Modifier,
} from './generations';
import {
  UNSTATED,
  type IntentOf,
  type LiftSource,
  type RawSearchParams,
  type Slot,
  type SlotDeclarations,
} from './slot';
import { SEARCH_SLOTS, type SearchIntent } from './slots';

export type LiftedSearch = {
  readonly generation: Generation;
  readonly modifiers: Modifier[];
  readonly intent: SearchIntent;
  readonly envelope: SearchEnvelope;
};

function sourceOf(raw: RawSearchParams): LiftSource {
  const entries = Object.entries(raw).flatMap(([k, v]) =>
    (Array.isArray(v) ? v : [v ?? '']).map(
      (val) => [k, val] as [string, string],
    ),
  );
  return { raw, parsed: qs.parse(new URLSearchParams(entries).toString()) };
}

/**
 * Reads one intent from the URL with the given declarations. Pure: it reads only the URL, never tenant
 * config, cookies or the network, and a slot the URL does not state stays unstated.
 */
export function liftIntent<D extends SlotDeclarations>(
  declarations: D,
  raw: RawSearchParams,
): IntentOf<D> {
  const source = sourceOf(raw);
  const intent: Record<string, Slot<unknown>> = {};
  for (const [name, declaration] of Object.entries(declarations)) {
    const value = declaration.decode(source);
    intent[name] = value === undefined ? UNSTATED : { stated: true, value };
  }
  return intent as IntentOf<D>;
}

/** Every top-level URL key the lift reads: a slot's or the envelope's. */
export function recognisedKeys(declarations: SlotDeclarations): Set<string> {
  return new Set<string>([
    ...Object.values(declarations).flatMap((d) => d.keys),
    ...ENVELOPE_KEYS,
  ]);
}

const RECOGNISED = recognisedKeys(SEARCH_SLOTS);

export class UnclassifiedSearchUrl extends Error {}

/** A /search URL's search parameters, as an intent, an envelope, and the generation that wrote it. */
export function liftSearchParams(raw: RawSearchParams): LiftedSearch {
  const intent = liftIntent(SEARCH_SLOTS, raw);
  const envelope = readEnvelope(raw, RECOGNISED);
  const generations = matchGenerations(intent, envelope);
  if (generations.length !== 1) {
    throw new UnclassifiedSearchUrl(
      `search URL matches ${generations.length} generations (${generations.join(', ')})`,
    );
  }
  return {
    generation: generations[0],
    modifiers: modifiersOf(intent, envelope),
    intent,
    envelope,
  };
}

/** Next.js searchParams for a query string: repeated keys become arrays, as the page receives them. */
export function rawSearchParams(query: string): RawSearchParams {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of new URLSearchParams(query)) {
    const prev = out[k];
    out[k] =
      prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

export function liftQueryString(query: string): LiftedSearch {
  return liftSearchParams(rawSearchParams(query));
}
