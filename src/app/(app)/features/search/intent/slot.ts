import type { ParsedQs } from 'qs';

/** Next.js searchParams, as the search page receives them. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Everything the lift may read. Both views come from the URL alone: `parsed` is the same parameters
 * through `qs` (bracket keys become objects and arrays), which is how today's parsers read them.
 */
export type LiftSource = {
  readonly raw: RawSearchParams;
  readonly parsed: ParsedQs;
};

/**
 * A slot is unstated (the URL said nothing the slot can read) or stated with a value. Empty strings and
 * "Everywhere" are stated. Nothing but the URL may make a slot stated: no defaults, no inference.
 */
export type Unstated = { readonly stated: false };
export type Stated<T> = { readonly stated: true; readonly value: T };
export type Slot<T> = Unstated | Stated<T>;

export const UNSTATED: Unstated = Object.freeze({ stated: false });

/** URL parameters in the order they are written. */
export type UrlPairs = ReadonlyArray<readonly [string, string]>;

/**
 * One slot, declared once. `keys` are the top-level URL keys it owns (a bracket key such as
 * `filters[x][0]` counts by its root). `decode` reads the slot from the URL and returns undefined when
 * the URL states nothing readable; `encode` writes a stated value back so that `decode` reads the same
 * value again. All three are required: a slot without its URL encoding is a type error.
 */
export type SlotDeclaration<T> = {
  readonly keys: readonly string[];
  readonly decode: (source: LiftSource) => T | undefined;
  // Method syntax keeps declarations of any T assignable to SlotDeclaration<unknown>.
  encode(value: T): UrlPairs;
};

export type SlotDeclarations = Record<string, SlotDeclaration<unknown>>;

export function defineSlots<D extends SlotDeclarations>(declarations: D): D {
  return declarations;
}

/** The intent a set of declarations describes: one Slot per declaration, typed by its decoder. */
export type IntentOf<D extends SlotDeclarations> = {
  readonly [K in keyof D]: D[K] extends SlotDeclaration<infer T>
    ? Slot<Exclude<T, undefined>>
    : never;
};

/**
 * A plain key's value as `qs` parsed it, read as its first value, as the browser's `URLSearchParams.get`
 * reads it (ISS-2472). `qs` makes an array of a repeated key (`location=a&location=b`) and of an index
 * bracket (`location[0]=a`, ISS-2473), so both read as their first value. A named or nested bracket
 * (`location[x]=a`, `location[0][k]=a`) and an index above qs's array limit of 20, which qs makes an
 * object, say nothing readable.
 */
export function firstValue(value: ParsedQs[string]): string | undefined {
  if (typeof value === 'string') return value;
  return Array.isArray(value) && typeof value[0] === 'string'
    ? value[0]
    : undefined;
}

/** A plain string parameter, read as its first value. */
export function stringParam(key: string): SlotDeclaration<string> {
  return {
    keys: [key],
    decode: ({ parsed }) => firstValue(parsed[key]),
    encode: (value) => [[key, value]],
  };
}
