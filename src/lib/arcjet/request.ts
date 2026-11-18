import type { ArcjetRequestLike } from './types';

/**
 * The request we send to Arcjet, built from what the client sent: the real
 * path and method, only the client's own headers, and only the `aj_signals`
 * cookie. See docs/bot-protection.md ("What Arcjet receives").
 *
 * The proxy (`src/proxy.ts`) records what the client sent in `x-norse-*`
 * request headers, always overwriting them so a client cannot forge them.
 * A server component reads the request as rewritten by the proxy, which also
 * carries our response headers (`set-cookie`, `x-middleware-set-cookie`,
 * `x-frame-options`, ...), so the client-header list is what tells them
 * apart.
 *
 * Pure: no Next.js runtime imports. `src/lib/arcjet-page.ts` reads
 * `headers()`/`cookies()` and calls `buildArcjetRequest`.
 */

/** The method the client used (pages read the request as a GET render). */
export const NORSE_REQ_METHOD_HEADER = 'x-norse-req-method';
/** Sorted, comma-joined names of the headers the client sent. */
export const NORSE_CLIENT_HEADERS_HEADER = 'x-norse-client-headers';
/** `1` when the request carried our `session-id` cookie, else `0`. */
export const NORSE_CLIENT_RETURNING_HEADER = 'x-norse-client-returning';
/** Sorted, comma-joined query key NAMES (never values). */
export const NORSE_QUERY_KEYS_HEADER = 'x-norse-query-keys';

export const NORSE_REQUEST_HEADERS = [
  NORSE_REQ_METHOD_HEADER,
  NORSE_CLIENT_HEADERS_HEADER,
  NORSE_CLIENT_RETURNING_HEADER,
  NORSE_QUERY_KEYS_HEADER,
] as const;

/** The only cookie Arcjet receives: the Advanced Signals result. */
export const ARCJET_SIGNALS_COOKIE = 'aj_signals';

/** Headers never sent to Arcjet: ours, or response headers. */
const DENIED_HEADERS = new Set([
  'set-cookie',
  'x-frame-options',
  'x-content-type-options',
  'x-xss-protection',
  'referrer-policy',
  'content-security-policy',
  'x-nonce',
  'x-robots-tag',
  'x-next-i18n-router-locale',
  'cookie',
]);

/** True for a header name we add or that belongs on a response. */
export function isInternalHeaderName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.startsWith('x-norse-') ||
    n.startsWith('x-middleware-') ||
    DENIED_HEADERS.has(n)
  );
}

/** Sorted, de-duplicated, lower-cased names; internal names left out. */
export function clientHeaderNamesOf(
  headers: Pick<Headers, 'forEach'>,
): string[] {
  const names = new Set<string>();
  headers.forEach((_value, name) => {
    const n = name.toLowerCase();
    if (!n.startsWith('x-norse-')) names.add(n);
  });
  return [...names].sort();
}

/** Parses the `x-norse-client-headers` value; undefined when absent. */
export function parseNameList(value: string | null): string[] | undefined {
  if (value === null) return undefined;
  return value
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}

/** Sorted query key names of a URL search string (`?a=1&b=2` → `a,b`). */
export function queryKeyNames(search: string): string[] {
  const keys = new Set<string>();
  try {
    for (const key of new URLSearchParams(search).keys()) {
      // Key names are ours (`query`, `coords`, ...). Cap a hostile one.
      if (key) keys.add(key.slice(0, 64));
    }
  } catch {
    // Unparseable: no keys.
  }
  return [...keys].sort().slice(0, 32);
}

/** What Norse knows about the request, beside what goes to Arcjet. */
export interface ArcjetRequestContext {
  /** Lower-cased host header, as sent. */
  host: string;
  /** Path only, never the query string. */
  path: string;
  method: string;
  /** Names of the headers the client sent (no `x-norse-*`). */
  clientHeaderNames: string[];
  /** Whether the names came from the proxy (false = denylist fallback). */
  clientHeaderNamesFromProxy: boolean;
  /** The client sent our `session-id` cookie; undefined when unknown. */
  clientReturning?: boolean;
  /** Sorted query key names; never values. */
  queryKeys: string[];
  ajSignalsPresent: boolean;
}

/** The request handed to `aj.protect()` (an `ArcjetNextRequest`). */
export interface ArcjetOutgoingRequest extends ArcjetRequestLike {
  headers: Headers;
  method: string;
  /** Path only. With no `nextUrl`, the SDK sets `query` to `""`. */
  url: string;
  cookies: Partial<Record<string, string>>;
}

export interface BuiltArcjetRequest {
  request: ArcjetOutgoingRequest;
  context: ArcjetRequestContext;
}

export interface BuildArcjetRequestInput {
  /** The request headers the server sees (`headers()`). */
  headers: Pick<Headers, 'get' | 'forEach'>;
  /** Value of the `aj_signals` cookie, when present. */
  ajSignals?: string;
  /** Path only, e.g. `/en/search/123`. A query string is cut off. */
  path: string;
  /** Used when the proxy recorded no method (page renders are GETs). */
  defaultMethod?: string;
}

/**
 * The request Arcjet receives. Headers are the ones the client sent
 * (`x-norse-client-headers`), read from the server's view; without that list
 * (a request that skipped the proxy) a denylist drops ours. `x-forwarded-for`
 * is kept: Arcjet needs it to resolve the client IP.
 */
export function buildArcjetRequest({
  headers,
  ajSignals,
  path,
  defaultMethod = 'GET',
}: BuildArcjetRequestInput): BuiltArcjetRequest {
  const pathOnly = stripQuery(path);
  const method = (
    headers.get(NORSE_REQ_METHOD_HEADER) || defaultMethod
  ).toUpperCase();
  const proxyNames = parseNameList(headers.get(NORSE_CLIENT_HEADERS_HEADER));
  const allowed = proxyNames ? new Set(proxyNames) : undefined;

  const out = new Headers();
  headers.forEach((value, rawName) => {
    const name = rawName.toLowerCase();
    if (isInternalHeaderName(name)) return;
    if (allowed && !allowed.has(name) && name !== 'x-forwarded-for') return;
    out.set(name, value);
  });

  const returningRaw = headers.get(NORSE_CLIENT_RETURNING_HEADER);
  const clientReturning =
    returningRaw === '1' ? true : returningRaw === '0' ? false : undefined;
  const queryKeys = parseNameList(headers.get(NORSE_QUERY_KEYS_HEADER)) ?? [];

  const cookies: Partial<Record<string, string>> = {};
  if (ajSignals) cookies[ARCJET_SIGNALS_COOKIE] = ajSignals;

  return {
    request: { headers: out, method, url: pathOnly, cookies },
    context: {
      host: (headers.get('host') ?? '').toLowerCase(),
      path: pathOnly,
      method,
      clientHeaderNames:
        proxyNames?.filter((n) => !n.startsWith('x-norse-')) ??
        clientHeaderNamesOf(out),
      clientHeaderNamesFromProxy: proxyNames !== undefined,
      clientReturning,
      queryKeys,
      ajSignalsPresent: Boolean(ajSignals),
    },
  };
}

function stripQuery(path: string): string {
  const cut = path.search(/[?#]/);
  const p = cut === -1 ? path : path.slice(0, cut);
  return p.startsWith('/') ? p : `/${p}`;
}

/** The route a path belongs to; a fixed, low-cardinality set. */
export type ArcjetRoute =
  'search' | 'resource' | 'details' | 'print' | 'pins' | 'other';

/** Route of a page path (`/en/search/123` → `resource`). */
export function routeOfPath(path: string): ArcjetRoute {
  if (/^\/api\/search-pins(\/|$)/.test(path)) return 'pins';
  if (/\/details\/original\//.test(path)) return 'details';
  if (/\/search\/[^/]+\/?$/.test(path)) return 'resource';
  if (/\/search\/?$/.test(path)) return 'search';
  return 'other';
}

/** The locale segment of a page path, or ''. */
export function localeOfPath(path: string): string {
  const first = path.split('/')[1] ?? '';
  return /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(first) ? first : '';
}
