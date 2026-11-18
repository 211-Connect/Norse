import { createHash } from 'node:crypto';

import type { ArcjetRequestContext } from './request';
import { isInternalHeaderName } from './request';

/**
 * Generic request features for the `arcjet_decision` record: header values
 * from a fixed allowlist, the shape of the header set, and the shape of the
 * referer. No fixed bot rules: the bot-report tool finds over-represented
 * values during a flood. See docs/observability.md ("arcjet_decision").
 *
 * Never logged: the full IP, the referer or origin path or query, query
 * values, cookie values, `authorization`, `x-api-key` or the body.
 */

/** Header → record field. Values are truncated to `HEADER_VALUE_MAX`. */
export const LOGGED_HEADER_VALUES: Readonly<Record<string, string>> = {
  'user-agent': 'h_user_agent',
  accept: 'h_accept',
  'accept-language': 'h_accept_language',
  'accept-encoding': 'h_accept_encoding',
  'sec-ch-ua': 'h_sec_ch_ua',
  'sec-ch-ua-mobile': 'h_sec_ch_ua_mobile',
  'sec-ch-ua-platform': 'h_sec_ch_ua_platform',
  'sec-fetch-site': 'h_sec_fetch_site',
  'sec-fetch-mode': 'h_sec_fetch_mode',
  'sec-fetch-dest': 'h_sec_fetch_dest',
  'sec-fetch-user': 'h_sec_fetch_user',
  'upgrade-insecure-requests': 'h_upgrade_insecure_requests',
  priority: 'h_priority',
  dnt: 'h_dnt',
  'sec-gpc': 'h_sec_gpc',
  'cache-control': 'h_cache_control',
  pragma: 'h_pragma',
  via: 'h_via',
  'x-requested-with': 'h_x_requested_with',
};

export const HEADER_VALUE_MAX = 256;
const ACCEPT_LANGUAGE_MAX = 64;

/**
 * Headers whose names are expected and not interesting in `h_unknown`
 * (values never logged): transport, our proxies, cookies, credentials and the
 * referer/origin, which are recorded only as shape flags.
 */
const KNOWN_HEADER_NAMES = new Set([
  'host',
  'connection',
  'content-length',
  'content-type',
  'cookie',
  'authorization',
  'x-api-key',
  'referer',
  'origin',
  'rsc',
  'next-router-prefetch',
  'next-router-state-tree',
  'next-router-segment-prefetch',
  'next-url',
  'next-action',
  'purpose',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-real-ip',
  'x-request-start',
  'do-connecting-ip',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cdn-loop',
  'x-rdwr-ip',
  'source_ip',
  'traceparent',
  'tracestate',
  'baggage',
]);

export interface RefererShape {
  ref_present: boolean;
  ref_host?: string;
  ref_same_host?: boolean;
  ref_scheme?: string;
  /** Raw value is `scheme://host` with no path: Arcjet's tell (17 Nov). */
  ref_path_empty?: boolean;
  ref_path_root?: boolean;
  ref_has_query?: boolean;
  origin_present: boolean;
  origin_same_host?: boolean;
}

const PATHLESS_URL = /^https?:\/\/[^/?#]+$/i;

function hostOfUrl(raw: string): string | undefined {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Shape of the referer and origin, from the RAW header strings: `new URL()`
 * adds a `/`, which would hide `ref_path_empty`. Only the host is kept;
 * the path and query never leave this function.
 */
export function refererShape(
  referer: string | null,
  origin: string | null,
  requestHost: string,
): RefererShape {
  const host = requestHost.split(':')[0].toLowerCase();
  const out: RefererShape = {
    ref_present: Boolean(referer),
    origin_present: Boolean(origin),
  };
  if (referer) {
    const raw = referer.trim();
    const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
    out.ref_scheme = schemeMatch ? schemeMatch[1].toLowerCase() : '';
    const refHost = hostOfUrl(raw);
    out.ref_host = refHost ?? '';
    out.ref_same_host = refHost !== undefined && refHost === host;
    out.ref_path_empty = PATHLESS_URL.test(raw);
    // Path exactly `/` in the raw string (an optional query is allowed).
    out.ref_path_root = /^https?:\/\/[^/?#]+\/(?:[?#].*)?$/i.test(raw);
    out.ref_has_query = /^[^#]*\?/.test(raw);
  }
  if (origin) {
    const originHost = hostOfUrl(origin.trim());
    out.origin_same_host = originHost !== undefined && originHost === host;
  }
  return out;
}

/** `Chrome 142` → `{ family: 'chrome', major: '142' }`. */
export function userAgentFamily(ua: string): { family: string; major: string } {
  const rules: [string, RegExp][] = [
    ['edge', /Edg(?:e|A|iOS)?\/(\d+)/],
    ['opera', /OPR\/(\d+)/],
    ['samsung', /SamsungBrowser\/(\d+)/],
    ['headlesschrome', /HeadlessChrome\/(\d+)/],
    ['firefox', /(?:Firefox|FxiOS)\/(\d+)/],
    ['chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['safari', /Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//],
  ];
  for (const [family, re] of rules) {
    const m = re.exec(ua);
    if (m) return { family, major: m[1] };
  }
  if (!ua) return { family: 'none', major: '' };
  const token = /^([A-Za-z][A-Za-z0-9_.-]{0,31})/.exec(ua)?.[1] ?? 'other';
  return { family: token.toLowerCase(), major: '' };
}

/** `"Chromium";v="142", "Google Chrome";v="142"` → brand names, sorted. */
export function secChUaBrands(value: string | null): string[] {
  if (!value) return [];
  const brands: string[] = [];
  const re = /"([^"]*)"\s*;\s*v="(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) brands.push(m[1]);
  return brands.sort();
}

function secChUaMajors(value: string | null): string[] {
  if (!value) return [];
  const majors: string[] = [];
  const re =
    /"(?:Chromium|Google Chrome|Microsoft Edge|Opera)"\s*;\s*v="(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) majors.push(m[1]);
  return majors;
}

const unquote = (v: string | null) => (v ?? '').replace(/"/g, '').trim();

function uaPlatform(ua: string): string {
  if (/Android/.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Windows/.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macos';
  if (/CrOS/.test(ua)) return 'chromeos';
  if (/Linux/.test(ua)) return 'linux';
  return '';
}

const CH_PLATFORM: Record<string, string> = {
  android: 'android',
  ios: 'ios',
  windows: 'windows',
  macos: 'macos',
  'chrome os': 'chromeos',
  chromeos: 'chromeos',
  linux: 'linux',
};

type HeaderGet = Pick<Headers, 'get'>;

/**
 * Optional helper flags, comma-joined into `checks`. Not the detection
 * logic: the report tool works from the raw features.
 */
export function computeHeaderChecks(
  headers: HeaderGet,
  shape: RefererShape,
): string[] {
  const ua = headers.get('user-agent') ?? '';
  const { family, major } = userAgentFamily(ua);
  const chUa = headers.get('sec-ch-ua');
  const chromium = ['chrome', 'edge', 'opera', 'samsung'].includes(family);
  const browser = chromium || family === 'firefox' || family === 'safari';
  const checks: string[] = [];

  const chMajors = secChUaMajors(chUa);
  if (chromium && major && chMajors.length && !chMajors.includes(major)) {
    checks.push('ua_ch_version_mismatch');
  }
  const chPlatform =
    CH_PLATFORM[unquote(headers.get('sec-ch-ua-platform')).toLowerCase()];
  const platform = uaPlatform(ua);
  if (chPlatform && platform && chPlatform !== platform) {
    checks.push('ua_ch_platform_mismatch');
  }
  const brands = secChUaBrands(chUa);
  if (
    family === 'chrome' &&
    brands.includes('Chromium') &&
    !brands.includes('Google Chrome') &&
    !/Android/.test(ua)
  ) {
    checks.push('chromium_brand_with_chrome_ua');
  }
  if (/Headless/i.test(ua) || brands.some((b) => /Headless/i.test(b))) {
    checks.push('headless');
  }
  if (browser && !headers.get('sec-fetch-mode') && family !== 'safari') {
    checks.push('browser_ua_without_sec_fetch');
  }
  if (browser && !headers.get('accept-language')) {
    checks.push('browser_ua_without_accept_language');
  }
  if (shape.ref_path_empty) checks.push('referer_path_empty');
  if (shape.ref_present && headers.get('sec-fetch-site') === 'none') {
    checks.push('referer_with_fetch_site_none');
  }
  return checks;
}

/**
 * A stable fingerprint of the client software, not of the person: the same
 * across IPs and minor versions, different between real Chrome and a bot
 * that copies only part of its headers. First 12 hex chars of SHA-256.
 */
export function clientSignature(
  headers: HeaderGet,
  shape: RefererShape,
  headerNames: string[],
): string {
  const { family, major } = userAgentFamily(headers.get('user-agent') ?? '');
  const parts = [
    `${family}/${major}`,
    secChUaBrands(headers.get('sec-ch-ua')).join('|'),
    unquote(headers.get('sec-ch-ua-platform')),
    headers.get('accept-language') ?? '',
    headers.get('accept') ?? '',
    headers.get('accept-encoding') ?? '',
    [
      headers.get('sec-fetch-site') ?? '',
      headers.get('sec-fetch-mode') ?? '',
      headers.get('sec-fetch-dest') ?? '',
      headers.get('sec-fetch-user') ?? '',
    ].join('/'),
    [
      shape.ref_present ? 1 : 0,
      shape.ref_same_host ? 1 : 0,
      shape.ref_path_empty ? 1 : 0,
      shape.ref_path_root ? 1 : 0,
      shape.ref_has_query ? 1 : 0,
    ].join(''),
    headerNames.join(','),
  ];
  return createHash('sha256')
    .update(parts.join('\n'))
    .digest('hex')
    .slice(0, 12);
}

export type FeatureValue = string | number | boolean;

export interface RequestFeatures {
  /** Flat record fields (h_*, ref_*, origin_*, h_names, ...). */
  fields: Record<string, FeatureValue>;
  signature: string;
  checks: string[];
  refPathEmpty: boolean;
}

/**
 * Every generic feature of a request for the decision record. `headers` is
 * what the server sees; only client headers are read (`context`).
 */
export function requestFeatures(
  headers: HeaderGet,
  context: ArcjetRequestContext,
): RequestFeatures {
  const fields: Record<string, FeatureValue> = {};
  for (const [name, field] of Object.entries(LOGGED_HEADER_VALUES)) {
    const value = headers.get(name);
    if (value === null) continue;
    const max =
      name === 'accept-language' ? ACCEPT_LANGUAGE_MAX : HEADER_VALUE_MAX;
    fields[field] = value.slice(0, max);
  }

  const names = context.clientHeaderNames.filter(
    (n) => !n.startsWith('x-norse-'),
  );
  fields.h_names = names.join(',');
  fields.h_count = names.length;
  fields.h_unknown = names
    .filter(
      (n) =>
        !(n in LOGGED_HEADER_VALUES) &&
        !KNOWN_HEADER_NAMES.has(n) &&
        !isInternalHeaderName(n),
    )
    .join(',');

  const shape = refererShape(
    headers.get('referer'),
    headers.get('origin'),
    context.host,
  );
  for (const [key, value] of Object.entries(shape)) {
    if (value !== undefined) fields[key] = value;
  }

  fields.is_rsc = headers.get('rsc') !== null;
  fields.is_prefetch =
    headers.get('next-router-prefetch') !== null ||
    (headers.get('purpose') ?? '').toLowerCase() === 'prefetch';
  fields.is_server_action = headers.get('next-action') !== null;

  const checks = computeHeaderChecks(headers, shape);
  const signature = clientSignature(headers, shape, names);
  return {
    fields,
    signature,
    checks,
    refPathEmpty: shape.ref_path_empty === true,
  };
}
