import type { RawSearchParams } from './slot';

/**
 * Markers about how a URL came to be and what page context it carries. They sit beside the intent, not in
 * its slots: they say nothing about what the visitor is searching for. Each holds the value as received;
 * readers decide what it means (today, `sllc === '1'` skips the legacy link gate).
 */
export type SearchEnvelope = {
  /** Loop guard written by the legacy deep-link gate. */
  readonly sllc?: string;
  /** Notify alert (`low_info`, `low_confidence`). */
  readonly a?: string;
  readonly page?: string;
  /** Printable directory and section the visitor is adding sources to. */
  readonly pdid?: string;
  readonly pdsid?: string;
  /** Retired analytics entry point (Norse #758 to #953). Still on old links; nothing reads it. */
  readonly entry?: string;
  /** Every parameter the lift does not recognise (`utm_*`, `gad_*`, `hl`, …), in the order received. */
  readonly passThrough: ReadonlyArray<readonly [string, string]>;
};

export const ENVELOPE_KEYS = [
  'sllc',
  'a',
  'page',
  'pdid',
  'pdsid',
  'entry',
] as const;

/** A single value, as the search page reads it: a repeated key is not a string. */
function single(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return typeof value === 'string' ? value : undefined;
}

/** The first value, as the browser's `URLSearchParams.get` reads it. */
function first(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

/** The key a parameter belongs to: `filters[a][0]` belongs to `filters`. */
export function rootKey(key: string): string {
  const bracket = key.indexOf('[');
  return bracket > 0 ? key.slice(0, bracket) : key;
}

export function readEnvelope(
  raw: RawSearchParams,
  recognised: ReadonlySet<string>,
): SearchEnvelope {
  const passThrough: Array<readonly [string, string]> = [];
  for (const [key, value] of Object.entries(raw)) {
    if (recognised.has(rootKey(key))) continue;
    for (const v of Array.isArray(value) ? value : [value ?? ''])
      passThrough.push([key, v]);
  }
  const markers = {
    sllc: single(raw, 'sllc'),
    a: single(raw, 'a'),
    page: single(raw, 'page'),
    pdid: first(raw, 'pdid'),
    pdsid: first(raw, 'pdsid'),
    entry: single(raw, 'entry'),
  };
  // Absent markers are left out rather than set to undefined, so an envelope reads as what the URL said.
  return {
    ...Object.fromEntries(
      Object.entries(markers).filter(([, v]) => v !== undefined),
    ),
    passThrough,
  };
}
