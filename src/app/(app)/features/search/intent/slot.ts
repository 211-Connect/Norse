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

/**
 * One slot, declared once. `keys` are the top-level URL keys it owns (a bracket key such as
 * `filters[x][0]` counts by its root). `decode` reads the slot from the URL and returns undefined when
 * the URL states nothing readable. Both are required: a slot without its URL encoding is a type error.
 */
export type SlotDeclaration<T> = {
  readonly keys: readonly string[];
  readonly decode: (source: LiftSource) => T | undefined;
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

/** A plain string parameter. Repeated or bracketed keys are not a string, so they are unstated. */
export function stringParam(key: string): SlotDeclaration<string> {
  return {
    keys: [key],
    decode: ({ parsed }) => {
      const value = parsed[key];
      return typeof value === 'string' ? value : undefined;
    },
  };
}
