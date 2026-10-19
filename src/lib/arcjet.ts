import { isIP } from 'node:net';

import { parseProxies, resolveClientIp } from '@arcjet/ip';
import arcjet, {
  type ArcjetDecision,
  type ArcjetNextRequest,
  cloudflare,
  detectBot,
  filter,
} from '@arcjet/next';

/**
 * Arcjet bot protection, called per page from the routes that serve
 * directory data (see `protectPage` in `src/lib/arcjet-page.ts`), not from
 * middleware: Arcjet recommends route-level calls, and a middleware call
 * would also run on every RSC navigation and prefetch. This module has no
 * Next.js runtime imports so it can be unit-tested; logging goes through
 * the `ArcjetLog` callback the caller supplies.
 *
 * ISS-1728: a denied decision on an enforced host is returned to the page,
 * which answers 403 via `forbidden()`.
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
 * Parse a comma-separated host list (lower-cased, ports stripped, blanks
 * dropped).
 */
export function parseHostList(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((h) => normalizeHost(h))
      .filter(Boolean),
  );
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0];
}

/**
 * Hosts where a DENY is enforced (403). Everywhere else Arcjet still runs
 * and logs `arcjet_denied` with `enforced: false`, but the request is
 * served. Read from `ARCJET_ENFORCED_HOSTS` at startup, so enforcement can
 * be rolled out per tenant and rolled back with an env change, no code
 * change. Unset or empty = log-only everywhere.
 *
 * MBOA (`mboa.c211.io`) must stay out of this list until MNIT confirms
 * which automated traffic is theirs (ISS-1737).
 */
export const ARCJET_ENFORCED_HOSTS: ReadonlySet<string> = parseHostList(
  process.env.ARCJET_ENFORCED_HOSTS,
);

/** Matches on the `host` header only (lower-cased, port stripped). */
export function isEnforcedHost(
  request: ArcjetRequestLike,
  enforcedHosts: ReadonlySet<string> = ARCJET_ENFORCED_HOSTS,
): boolean {
  return enforcedHosts.has(hostOf(request));
}

function hostOf(request: ArcjetRequestLike): string {
  return normalizeHost(request.headers.get('host') ?? '');
}

/**
 * The only host where a request with no routable client IP gets special
 * handling, and only when it arrived through the mn.gov proxy (ISS-1734):
 * see `internalIpSrc`. Anywhere else, missing or untrusted forwarding
 * headers go to Arcjet unchanged.
 */
export const NO_CLIENT_IP_BYPASS_HOST = 'mboa.c211.io' as const;

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

/** Headers that carry client IPs; logged masked (see `maskIp`). */
const IP_HEADERS = new Set([
  'x-forwarded-for',
  'do-connecting-ip',
  'cf-connecting-ip',
  'x-real-ip',
  'x-rdwr-ip',
  'source_ip',
]);

/**
 * The only headers ever logged. An allowlist, so a header added later is
 * excluded by default. Never add `referer` (it carries the search query),
 * `cookie` or `authorization`.
 */
const LOGGED_HEADERS = new Set([
  'host',
  'user-agent',
  'accept',
  'accept-language',
  'via',
  ...IP_HEADERS,
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
       * `NO_CLIENT_IP` = MBOA via the mn.gov proxy with no client address at
       * all (not even an internal one); deliberately allowed.
       */
      conclusion:
        'ALLOW' | 'CHALLENGE' | 'ERROR' | 'SKIPPED' | 'THREW' | 'NO_CLIENT_IP';
    }
  | {
      /** Denied by Arcjet but the host is not in ARCJET_ENFORCED_HOSTS. */
      denied: false;
      conclusion: 'DENIED_NOT_ENFORCED';
      deniedBots: string[];
    }
  | { denied: true; conclusion: 'DENY'; deniedBots: string[] };

/** The parts of a request this module reads: headers only. */
export interface ArcjetRequestLike {
  headers: Pick<Headers, 'get' | 'forEach'>;
}

export interface ArcjetClientLike {
  protect(
    request: ArcjetRequestLike,
    options?: { ipSrc?: string },
  ): Promise<ArcjetDecision>;
}

/**
 * The hop the mn.gov proxy appended to `x-forwarded-for`: the entry
 * immediately left of the last `MBOA_PROXY_IP`. That proxy wrote it, so it
 * is trusted even though it is a private (State network) address; entries
 * further left were written by hops we do not control. Returns undefined
 * when the proxy is absent or that entry is not an IP. Pattern advised by
 * Arcjet support (2026-10-19).
 */
export function internalIpSrc(forwardedFor: string | null): string | undefined {
  const hops = (forwardedFor ?? '').split(',').map((hop) => hop.trim());
  const proxyAt = hops.lastIndexOf(MBOA_PROXY_IP);
  const peer = proxyAt > 0 ? hops[proxyAt - 1] : undefined;
  return peer && isIP(peer) !== 0 ? peer : undefined;
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function maskIpv4(ip: string): string | undefined {
  const m = IPV4.exec(ip);
  if (!m || m.slice(1).some((o) => Number(o) > 255)) return undefined;
  return `${m[1]}.${m[2]}.x.x`;
}

/**
 * Mask an address for logging: IPv4 to its first two octets, IPv6 to its
 * first two groups. Every address is masked the same way, routable or not.
 * A `:port` suffix (and `[v6]:port`) is dropped first; IPv4-mapped IPv6
 * keeps its prefix and masks the IPv4 part. Anything unparseable becomes
 * `x`, so a malformed value can never leak verbatim.
 */
export function maskIp(value: string): string {
  let ip = value.trim();
  if (!ip) return ip;

  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(ip);
  if (bracketed) ip = bracketed[1];

  const v4WithPort = /^([\d.]+):\d{1,5}$/.exec(ip);
  if (v4WithPort) ip = v4WithPort[1];

  const v4 = maskIpv4(ip);
  if (v4) return v4;

  const mapped = /^::ffff:([\d.]+)$/i.exec(ip);
  if (mapped) {
    const inner = maskIpv4(mapped[1]);
    return inner ? `::ffff:${inner}` : 'x';
  }

  if (/^[0-9a-f:]+$/i.test(ip) && ip.includes(':')) {
    const groups = ip.split(':');
    if (groups.length <= 8 && groups.every((g) => g.length <= 4)) {
      return `${groups.slice(0, 2).join(':')}:x`;
    }
  }
  return 'x';
}

function maskIpList(value: string): string {
  return value
    .split(',')
    .map((part) => maskIp(part))
    .join(', ');
}

/**
 * Request headers safe to log: only `LOGGED_HEADERS`, with IP-bearing
 * headers masked. Every other header is dropped.
 */
export function redactHeaders(
  headers: ArcjetRequestLike['headers'],
): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, rawName) => {
    const name = rawName.toLowerCase();
    if (!LOGGED_HEADERS.has(name)) return;
    out[name] = IP_HEADERS.has(name) ? maskIpList(value) : value;
  });
  return out;
}

/**
 * The client IP Arcjet resolves for this request (same proxy list), or ''
 * when no globally routable address is left after trusted proxies and
 * private/CGNAT/ULA hops are skipped.
 */
function resolveClientIpOrEmpty(request: ArcjetRequestLike): string {
  try {
    const { ip } = resolveClientIp(
      { headers: request.headers as Headers },
      { proxies: PARSED_PROXIES },
    );
    return ip;
  } catch {
    return '';
  }
}

/** As `resolveClientIpOrEmpty`, with `'unknown'` for the empty case. */
export function resolveArcjetClientIp(request: ArcjetRequestLike): string {
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

/**
 * `pathName` is supplied by the page and is a path only: never include the
 * query string, which can carry crisis searches and coordinates.
 */
function requestContext(request: ArcjetRequestLike, pathName: string) {
  return {
    host: request.headers.get('host') ?? 'unknown',
    pathName,
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

/** See the internal-traffic branch in `arcjetProtect`. */
function isMboaWithoutClientIp(request: ArcjetRequestLike): boolean {
  return (
    hostOf(request) === NO_CLIENT_IP_BYPASS_HOST &&
    request.headers.get('do-connecting-ip')?.trim() === MBOA_PROXY_IP &&
    resolveClientIpOrEmpty(request) === ''
  );
}

export interface ArcjetProtectOptions {
  /** Test seam for the per-minute header-log sampler. */
  sampleHeaderLog?: () => boolean;
  /** Hosts where a DENY is enforced. */
  enforcedHosts?: ReadonlySet<string>;
}

export function createArcjetProtect(
  client: ArcjetClientLike | undefined,
  options: ArcjetProtectOptions = {},
) {
  const sampleHeaderLog =
    options.sampleHeaderLog ??
    createMinuteSampler(FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
  const enforcedHosts = options.enforcedHosts ?? ARCJET_ENFORCED_HOSTS;

  function logFingerprintFailed(
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
    detail: { conclusion: string; errorType: string; message: string },
  ) {
    const base = { ...requestContext(request, pathName), ...detail };
    if (sampleHeaderLog()) {
      log('warn', 'arcjet_fingerprint_failed', {
        ...base,
        headers: redactHeaders(request.headers),
      });
    } else {
      log('warn', 'arcjet_fingerprint_failed_sampled_out', base);
    }
  }

  function logNoClientIp(
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
    ipSrc: string | undefined,
  ) {
    const base = {
      host: request.headers.get('host') ?? 'unknown',
      pathName,
      ipSrc: ipSrc ? maskIp(ipSrc) : 'none',
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
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
  ): Promise<ArcjetProtectResult> {
    if (!client) return { denied: false, conclusion: 'SKIPPED' };

    /**
     * MBOA internal traffic. On the MBOA app ~70 req/min arrive through the
     * mn.gov proxy with only private hops in front of it (visitors on the
     * State of Minnesota network), so the SDK finds no global client IP and
     * cannot build a fingerprint. We pass the hop the mn.gov proxy appended
     * as `ipSrc` (see `internalIpSrc`), so these requests get a real
     * decision: browsers pass, bots are still detected by user agent. IP
     * reputation, geo and verified-bot checks cannot match a private
     * address, and everyone behind that hop shares one IP identity: any
     * future IP-keyed rate limit must use a session/user characteristic
     * here. Scoped to that host AND that proxy: forwarding headers can be
     * spoofed, so on any other request a missing client IP goes to Arcjet
     * unchanged. With no usable hop at all, the request is allowed
     * (NO_CLIENT_IP) without calling Arcjet.
     */
    let protectOptions: { ipSrc: string } | undefined;
    if (isMboaWithoutClientIp(request)) {
      const ipSrc = internalIpSrc(request.headers.get('x-forwarded-for'));
      logNoClientIp(request, pathName, log, ipSrc);
      if (!ipSrc) return { denied: false, conclusion: 'NO_CLIENT_IP' };
      protectOptions = { ipSrc };
    }

    let decision: ArcjetDecision;
    try {
      decision = await client.protect(request, protectOptions);
    } catch (error) {
      // Fail open: a protection outage must never take the site down.
      logFingerprintFailed(request, pathName, log, {
        conclusion: 'THREW',
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      return { denied: false, conclusion: 'THREW' };
    }

    if (decision.isDenied()) {
      const deniedBots = deniedBotsOf(decision);
      const enforced = isEnforcedHost(request, enforcedHosts);
      log('warn', 'arcjet_denied', {
        ...requestContext(request, pathName),
        reason: decision.reason,
        reasonType: decision.reason.type,
        deniedBots,
        decisionId: decision.id,
        enforced,
      });
      if (!enforced) {
        return { denied: false, conclusion: 'DENIED_NOT_ENFORCED', deniedBots };
      }
      return { denied: true, conclusion: 'DENY', deniedBots };
    }

    if (decision.isErrored()) {
      logFingerprintFailed(request, pathName, log, {
        conclusion: decision.conclusion,
        errorType: decision.reason.type,
        message: errorMessageOf(decision),
      });
      return { denied: false, conclusion: 'ERROR' };
    }

    for (const match of dryRunMatchesOf(decision)) {
      log('warn', 'arcjet_dry_run_match', {
        ...requestContext(request, pathName),
        ...match,
        decisionId: decision.id,
      });
    }

    return {
      denied: false,
      conclusion: decision.conclusion === 'CHALLENGE' ? 'CHALLENGE' : 'ALLOW',
    };
  }

  /** `enforcedHosts` is exposed so callers/tests can see what is in effect. */
  return Object.assign(arcjetProtect, { enforcedHosts });
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
 * Run Arcjet on a page request. No-op (`SKIPPED`) without `ARCJET_KEY`.
 * Never throws.
 */
export const arcjetProtect = createArcjetProtect(
  aj && {
    // The page passes `request()` from @arcjet/next; the narrower type here
    // only reflects what this module reads.
    protect: (request, options) =>
      aj.protect(request as ArcjetNextRequest, options),
  },
);
