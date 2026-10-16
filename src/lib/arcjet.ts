import { parseProxies, resolveClientIp } from '@arcjet/ip';
import arcjet, {
  type ArcjetDecision,
  cloudflare,
  detectBot,
} from '@arcjet/next';
import type { NextRequest } from 'next/server';

/**
 * Arcjet bot protection, called from `src/proxy.ts` (Edge runtime) on every
 * request the middleware matcher covers. This module must stay Edge-safe:
 * no pino, no Node-only imports. Logging goes through the `ArcjetLog`
 * callback the caller supplies (the proxy passes its `edgeLog`).
 *
 * ISS-1728: a denied decision is returned to the proxy, which answers 403.
 * ISS-2305: allow list below.
 * ISS-1734: fingerprint failures log redacted request headers (sampled).
 * ISS-1739: the SDK's own log level is `ARCJET_LOG_LEVEL` (see .env.examples).
 */

export const MBOA_PROXY_IP = '13.86.38.95' as const;

/** Same list the SDK uses, so the IP we log is the IP Arcjet decided on. */
const PROXIES = [cloudflare(), MBOA_PROXY_IP];
const PARSED_PROXIES = parseProxies(PROXIES);

/**
 * Bots allowed through `detectBot`. Evidence measured 2026-10-16 from prod
 * logs over ~4h. Arcjet denies a request when ANY of its labels is
 * unallowed, so a bot carrying two labels needs both named.
 */
export const ARCJET_ALLOWED_BOTS = [
  'CATEGORY:SEARCH_ENGINE',
  'CATEGORY:PREVIEW',
  'CATEGORY:MONITOR',
  // Verified Meta requests carry two labels: META_WEBINDEXER (allowed via
  // SEARCH_ENGINE) and FACEBOOK_CRAWLER. 2,389 denials in 2.5h.
  'FACEBOOK_CRAWLER',
  // State of Minnesota's accessibility scanner reaching MBOA via the mn.gov
  // proxy. 10,747 denials in 4h20m. CATEGORY:UNKNOWN, so it must be named.
  // Pending confirmation with MBOA (ISS-1737).
  'SITEIMPROVE_CRAWLER',
  // Non-US search engines, CATEGORY:UNKNOWN in Arcjet's taxonomy. MBOA
  // serves Hmong and Somali communities.
  'NAVER_CRAWLER',
  'BAIDU_CRAWLER',
] as const;

/** Headers never logged, in any form. */
const DROPPED_HEADERS = new Set(['cookie', 'set-cookie', 'authorization']);

/** Headers that carry client IPs; logged masked to their first 2 octets. */
const IP_HEADERS = new Set([
  'x-forwarded-for',
  'do-connecting-ip',
  'cf-connecting-ip',
  'x-real-ip',
  'x-rdwr-ip',
  'source_ip',
]);

/**
 * Max `arcjet_fingerprint_failed` events carrying redacted headers per
 * minute per process. Measured 2026-10-16: ~70/min on the MBOA app, so the
 * header-bearing event is sampled and the rest emit a counter-only warn.
 */
export const FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE = 5;

export type ArcjetLogLevel = 'debug' | 'warn';
export type ArcjetLog = (
  level: ArcjetLogLevel,
  event: string,
  data: Record<string, unknown>,
) => void;

export type ArcjetProtectResult =
  | {
      denied: false;
      /** `SKIPPED` = no ARCJET_KEY; `THREW` = SDK threw (failed open). */
      conclusion: 'ALLOW' | 'CHALLENGE' | 'ERROR' | 'SKIPPED' | 'THREW';
    }
  | { denied: true; conclusion: 'DENY'; deniedBots: string[] };

export interface ArcjetClientLike {
  protect(request: NextRequest): Promise<ArcjetDecision>;
}

export function maskIp(value: string): string {
  const ip = value.trim();
  if (!ip) return ip;
  if (ip.includes(':')) {
    const groups = ip.split(':');
    return `${groups.slice(0, 2).join(':')}:x`;
  }
  const octets = ip.split('.');
  return `${octets.slice(0, 2).join('.')}.x.x`;
}

function maskIpList(value: string): string {
  return value
    .split(',')
    .map((part) => maskIp(part))
    .join(', ');
}

/**
 * Request headers safe to log: cookies/authorization dropped, IP-bearing
 * headers masked to their first two octets, everything else verbatim.
 */
export function redactHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, rawName) => {
    const name = rawName.toLowerCase();
    if (DROPPED_HEADERS.has(name)) return;
    out[name] = IP_HEADERS.has(name) ? maskIpList(value) : value;
  });
  return out;
}

/** The client IP Arcjet resolves for this request (same proxy list). */
export function resolveArcjetClientIp(request: NextRequest): string {
  try {
    const { ip } = resolveClientIp(
      { headers: request.headers },
      { proxies: PARSED_PROXIES },
    );
    return ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Returns true at most `maxPerMinute` times in any wall-clock minute. */
export function createMinuteSampler(
  maxPerMinute: number,
  now: () => number = Date.now,
): () => boolean {
  let windowStart = 0;
  let count = 0;
  return () => {
    const minute = Math.floor(now() / 60_000);
    if (minute !== windowStart) {
      windowStart = minute;
      count = 0;
    }
    count += 1;
    return count <= maxPerMinute;
  };
}

function requestContext(request: NextRequest) {
  return {
    host: request.headers.get('host') ?? 'unknown',
    pathName: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ip: resolveArcjetClientIp(request),
    doConnectingIp: request.headers.get('do-connecting-ip') ?? 'unknown',
  };
}

function deniedBotsOf(decision: ArcjetDecision): string[] {
  const bots = new Set<string>();
  if (decision.reason.isBot()) {
    for (const bot of decision.reason.denied) bots.add(bot);
  }
  for (const result of decision.results) {
    if (result.conclusion === 'DENY' && result.reason.isBot()) {
      for (const bot of result.reason.denied) bots.add(bot);
    }
  }
  return [...bots];
}

function errorMessageOf(decision: ArcjetDecision): string {
  if (decision.reason.isError()) return decision.reason.message;
  const errored = decision.results.find((r) => r.reason.isError());
  return errored?.reason.isError() ? errored.reason.message : 'unknown';
}

export function createArcjetProtect(
  client: ArcjetClientLike | undefined,
  options: { sampleHeaderLog?: () => boolean } = {},
) {
  const sampleHeaderLog =
    options.sampleHeaderLog ??
    createMinuteSampler(FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);

  function logFingerprintFailed(
    request: NextRequest,
    log: ArcjetLog,
    detail: { conclusion: string; errorType: string; message: string },
  ) {
    const base = { ...requestContext(request), ...detail };
    if (sampleHeaderLog()) {
      log('warn', 'arcjet_fingerprint_failed', {
        ...base,
        headers: redactHeaders(request.headers),
      });
    } else {
      log('warn', 'arcjet_fingerprint_failed_sampled_out', base);
    }
  }

  return async function arcjetProtect(
    request: NextRequest,
    log: ArcjetLog,
  ): Promise<ArcjetProtectResult> {
    if (!client) return { denied: false, conclusion: 'SKIPPED' };

    let decision: ArcjetDecision;
    try {
      decision = await client.protect(request);
    } catch (error) {
      // Fail open: a protection outage must never take the site down.
      logFingerprintFailed(request, log, {
        conclusion: 'THREW',
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      return { denied: false, conclusion: 'THREW' };
    }

    if (decision.isDenied()) {
      const deniedBots = deniedBotsOf(decision);
      log('warn', 'arcjet_denied', {
        ...requestContext(request),
        reason: decision.reason,
        deniedBots,
        decisionId: decision.id,
      });
      return { denied: true, conclusion: 'DENY', deniedBots };
    }

    if (decision.isErrored()) {
      logFingerprintFailed(request, log, {
        conclusion: decision.conclusion,
        errorType: decision.reason.type,
        message: errorMessageOf(decision),
      });
      return { denied: false, conclusion: 'ERROR' };
    }

    return {
      denied: false,
      conclusion: decision.conclusion === 'CHALLENGE' ? 'CHALLENGE' : 'ALLOW',
    };
  };
}

const arcjetKey = process.env.ARCJET_KEY;

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      proxies: PROXIES,
      rules: [
        detectBot({
          mode: 'LIVE',
          allow: [...ARCJET_ALLOWED_BOTS],
        }),
      ],
    })
  : undefined;

/**
 * Run Arcjet on a middleware request. No-op (`SKIPPED`) without
 * `ARCJET_KEY`. Never throws.
 */
export const arcjetProtect = createArcjetProtect(aj);
