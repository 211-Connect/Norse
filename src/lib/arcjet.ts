import { parseProxies, resolveClientIp } from '@arcjet/ip';
import arcjet, {
  type ArcjetDecision,
  cloudflare,
  detectBot,
  filter,
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

/**
 * Hosts where Arcjet runs and logs but a DENY is NOT enforced.
 * Temporary: MBOA (State of Minnesota) is excluded until MNIT confirms
 * which automated traffic is theirs (ISS-1737). To enforce for MBOA,
 * delete its entry; no other change is needed.
 */
export const ARCJET_ENFORCEMENT_EXCLUDED_HOSTS: ReadonlySet<string> = new Set([
  'mboa.c211.io',
]);

/** Matches on the `host` header only (lower-cased, port stripped). */
export function isEnforcementExcludedHost(
  request: NextRequest,
  excludedHosts: ReadonlySet<string> = ARCJET_ENFORCEMENT_EXCLUDED_HOSTS,
): boolean {
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  return excludedHosts.has(host);
}

/**
 * ISS-1744: a request with no User-Agent cannot be evaluated by the bot rule
 * and today ends as CONCLUSION_ERROR (fail-open). Arcjet support recommends
 * denying it outright. The filter rule runs in DRY_RUN until the dry-run
 * impact has been read after deploy; then switch its mode to LIVE.
 */
export const NO_USER_AGENT_FILTER =
  'len(http.request.headers["user-agent"]) eq 0' as const;

/** The rule set passed to `arcjet()`; exported so tests can inspect it. */
export function buildArcjetRules() {
  return [
    detectBot({
      mode: 'LIVE',
      allow: [...ARCJET_ALLOWED_BOTS],
    }),
    // ISS-1744: a request with no User-Agent cannot be evaluated by the bot
    // rule and today ends as CONCLUSION_ERROR (fail-open). Arcjet support
    // recommends denying it outright. DRY_RUN until the dry-run impact has
    // been read after deploy; then switch to LIVE.
    filter({
      mode: 'DRY_RUN',
      deny: [NO_USER_AGENT_FILTER],
    }),
  ];
}

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
 * Max `arcjet_fingerprint_failed` / `arcjet_no_client_ip` events carrying
 * redacted headers per minute per process. Measured 2026-10-16: ~70/min
 * (~100k/day) on the MBOA app, so the header-bearing event is sampled and
 * the rest emit a counter-only warn (`*_sampled_out`).
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
      /**
       * `SKIPPED` = no ARCJET_KEY; `THREW` = SDK threw (failed open);
       * `NO_CLIENT_IP` = no routable client address, deliberately allowed.
       */
      conclusion:
        'ALLOW' | 'CHALLENGE' | 'ERROR' | 'SKIPPED' | 'THREW' | 'NO_CLIENT_IP';
    }
  | {
      /** Denied by Arcjet but the host is in ARCJET_ENFORCEMENT_EXCLUDED_HOSTS. */
      denied: false;
      conclusion: 'DENIED_NOT_ENFORCED';
      deniedBots: string[];
      /** `decision.reason.type`: 'BOT' | 'FILTER' | ... (ISS-2366). */
      reasonType: string;
    }
  | {
      denied: true;
      conclusion: 'DENY';
      deniedBots: string[];
      reasonType: string;
    };

/** The denied shapes of `ArcjetProtectResult`. */
export type ArcjetDeniedResult = Extract<
  ArcjetProtectResult,
  { conclusion: 'DENY' | 'DENIED_NOT_ENFORCED' }
>;

/** True for both an enforced DENY and an observe-only DENIED_NOT_ENFORCED. */
export function isArcjetDeniedResult(
  result: ArcjetProtectResult,
): result is ArcjetDeniedResult {
  return (
    result.conclusion === 'DENY' || result.conclusion === 'DENIED_NOT_ENFORCED'
  );
}

export interface ArcjetClientLike {
  protect(request: NextRequest): Promise<ArcjetDecision>;
}

/**
 * Addresses that identify infrastructure rather than a person: private
 * (10/8, 172.16/12, 192.168/16), CGNAT (100.64/10), loopback, link-local,
 * and IPv6 ULA (fc00::/7) / loopback / link-local. These are logged
 * unmasked because MNIT needs the exact value to trace MBOA's network path.
 */
export function isNonRoutableIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (/^f[cd][0-9a-f]{0,2}:/.test(lower)) return true; // fc00::/7
    if (/^fe[89ab][0-9a-f]?:/.test(lower)) return true; // fe80::/10
    return false;
  }
  const octets = ip.split('.').map((o) => Number(o));
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) return false;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/**
 * Mask a globally routable address to its first two octets (IPv6: first
 * two groups). Non-routable addresses (see `isNonRoutableIp`) pass through
 * unmasked.
 */
export function maskIp(value: string): string {
  const ip = value.trim();
  if (!ip) return ip;
  if (isNonRoutableIp(ip)) return ip;
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

/**
 * The client IP Arcjet resolves for this request (same proxy list), or ''
 * when no globally routable address is left after trusted proxies and
 * private/CGNAT/ULA hops are skipped.
 */
function resolveClientIpOrEmpty(request: NextRequest): string {
  try {
    const { ip } = resolveClientIp(
      { headers: request.headers },
      { proxies: PARSED_PROXIES },
    );
    return ip;
  } catch {
    return '';
  }
}

/** As `resolveClientIpOrEmpty`, with `'unknown'` for the empty case. */
export function resolveArcjetClientIp(request: NextRequest): string {
  return resolveClientIpOrEmpty(request) || 'unknown';
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

/**
 * Rule results that matched in DRY_RUN: the overall decision stays ALLOW,
 * but the rule reports what it would have done. Logged so the dry-run
 * impact of a rule (e.g. the ISS-1744 no-User-Agent filter) can be read
 * from our own logs before it is promoted to LIVE.
 */
function dryRunMatchesOf(decision: ArcjetDecision) {
  return decision.results
    .filter((r) => r.state === 'DRY_RUN' && r.conclusion === 'DENY')
    .map((r) => ({
      ruleType: (r.reason.type ?? 'unknown').toLowerCase(),
      ruleId: r.ruleId,
      matchedExpressions: r.reason.isFilter()
        ? r.reason.matchedExpressions
        : undefined,
      deniedBots: r.reason.isBot() ? r.reason.denied : undefined,
    }));
}

function errorMessageOf(decision: ArcjetDecision): string {
  if (decision.reason.isError()) return decision.reason.message;
  const errored = decision.results.find((r) => r.reason.isError());
  return errored?.reason.isError() ? errored.reason.message : 'unknown';
}

export interface ArcjetProtectOptions {
  /** Test seam for the per-minute header-log sampler. */
  sampleHeaderLog?: () => boolean;
  /** Hosts where a DENY is logged but not enforced. */
  excludedHosts?: ReadonlySet<string>;
}

export function createArcjetProtect(
  client: ArcjetClientLike | undefined,
  options: ArcjetProtectOptions = {},
) {
  const sampleHeaderLog =
    options.sampleHeaderLog ??
    createMinuteSampler(FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
  const excludedHosts =
    options.excludedHosts ?? ARCJET_ENFORCEMENT_EXCLUDED_HOSTS;

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

  function logNoClientIp(request: NextRequest, log: ArcjetLog) {
    const base = {
      host: request.headers.get('host') ?? 'unknown',
      pathName: `${request.nextUrl.pathname}${request.nextUrl.search}`,
      doConnectingIp: request.headers.get('do-connecting-ip') ?? 'unknown',
      forwardedFor: maskIpList(request.headers.get('x-forwarded-for') ?? ''),
    };
    if (sampleHeaderLog()) {
      log('warn', 'arcjet_no_client_ip', {
        ...base,
        headers: redactHeaders(request.headers),
      });
    } else {
      log('warn', 'arcjet_no_client_ip_sampled_out', base);
    }
  }

  async function arcjetProtect(
    request: NextRequest,
    log: ArcjetLog,
  ): Promise<ArcjetProtectResult> {
    if (!client) return { denied: false, conclusion: 'SKIPPED' };

    /**
     * Deliberate allow. On the MBOA app ~70 req/min arrive with no globally
     * routable client address once trusted proxies and private/CGNAT hops
     * are skipped (visitors on the State of Minnesota network). The SDK
     * would fail fingerprinting for these, so we do not call it at all and
     * count them instead. Any future rule keyed on IP (sliding window,
     * fingerprint cache, hosting/VPN checks) must treat NO_CLIENT_IP as
     * pass-through, not as a shared "" identity.
     */
    if (resolveClientIpOrEmpty(request) === '') {
      logNoClientIp(request, log);
      return { denied: false, conclusion: 'NO_CLIENT_IP' };
    }

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
      const enforced = !isEnforcementExcludedHost(request, excludedHosts);
      const reasonType = decision.reason.type ?? 'unknown';
      log('warn', 'arcjet_denied', {
        ...requestContext(request),
        reason: decision.reason,
        reasonType,
        deniedBots,
        decisionId: decision.id,
        enforced,
      });
      if (!enforced) {
        return {
          denied: false,
          conclusion: 'DENIED_NOT_ENFORCED',
          deniedBots,
          reasonType,
        };
      }
      return { denied: true, conclusion: 'DENY', deniedBots, reasonType };
    }

    if (decision.isErrored()) {
      logFingerprintFailed(request, log, {
        conclusion: decision.conclusion,
        errorType: decision.reason.type,
        message: errorMessageOf(decision),
      });
      return { denied: false, conclusion: 'ERROR' };
    }

    for (const match of dryRunMatchesOf(decision)) {
      log('warn', 'arcjet_dry_run_match', {
        ...requestContext(request),
        ...match,
        decisionId: decision.id,
      });
    }

    return {
      denied: false,
      conclusion: decision.conclusion === 'CHALLENGE' ? 'CHALLENGE' : 'ALLOW',
    };
  }

  /** `excludedHosts` is exposed so callers/tests can see what is in effect. */
  return Object.assign(arcjetProtect, { excludedHosts });
}

const arcjetKey = process.env.ARCJET_KEY;

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      proxies: PROXIES,
      rules: buildArcjetRules(),
    })
  : undefined;

/**
 * Run Arcjet on a middleware request. No-op (`SKIPPED`) without
 * `ARCJET_KEY`. Never throws.
 */
export const arcjetProtect = createArcjetProtect(aj);
