import arcjet, {
  type ArcjetDecision,
  type ArcjetNextRequest,
  createRemoteClient,
} from '@arcjet/next';

import {
  ARCJET_PROXIES,
  internalIpSrc,
  isMboaWithoutClientIp,
} from './client-ip';
import {
  ARCJET_ENFORCEMENT,
  type ArcjetEnforcement,
  isEnforcedHost,
} from './enforcement';
import {
  createMinuteSampler,
  maskIp,
  maskIpList,
  redactHeaders,
} from './redact';
import { buildArcjetRules } from './rules';
import type { ArcjetLog, ArcjetRequestLike } from './types';
import { eventLoopDelayMs } from '../event-loop';

/**
 * Arcjet bot protection, called per page from the routes that serve
 * directory data (see `protectPage` in `src/lib/arcjet-page.ts`), not from
 * middleware: Arcjet recommends route-level calls, and a middleware call
 * would also run on every RSC navigation and prefetch. This module has no
 * Next.js runtime imports so it can be unit-tested; logging goes through
 * the `ArcjetLog` callback the caller supplies. See docs/bot-protection.md.
 *
 * - `rules.ts`: the allow list and rules (ISS-2305, ISS-1744).
 * - `enforcement.ts`: which hosts get a 403 (ISS-1728).
 * - `client-ip.ts`: proxies and MBOA internal traffic (ISS-1734).
 * - `redact.ts`: what may be logged.
 *
 * Logs never carry the client IP of a decision: `decisionId` finds the full
 * request in the Arcjet console. Only events with no Arcjet decision
 * (fingerprint failures, no client IP) log headers, masked and sampled.
 */

export * from './client-ip';
export * from './enforcement';
export * from './redact';
export * from './rules';
export type * from './types';

/**
 * Max `arcjet_fingerprint_failed` / `arcjet_no_client_ip` events carrying
 * redacted headers per minute per process. Measured 2026-10-16: ~70/min
 * (~100k/day) on the MBOA app, so the header-bearing event is sampled and
 * the rest emit a counter-only warn (`*_sampled_out`).
 */
export const FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE = 5;

/**
 * Max `arcjet_denied` lines per minute per process, so a scraper flood is
 * not a log flood. Denials over the limit are counted, not logged; the next
 * line logged carries the count in `sampledOutSinceLast`. Every denial is
 * still a decision in the Arcjet console.
 */
export const DENIED_LOG_MAX_PER_MINUTE = 30;

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
      /** Denied by Arcjet but the host is not enforced (see ARCJET_ENFORCEMENT). */
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
  protect(
    request: ArcjetRequestLike,
    options?: { ipSrc?: string },
  ): Promise<ArcjetDecision>;
}

/**
 * `pathName` is supplied by the page and is a path only: never include the
 * query string, which can carry crisis searches and coordinates.
 */
function requestContext(request: ArcjetRequestLike, pathName: string) {
  return {
    host: request.headers.get('host') ?? 'unknown',
    pathName,
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
  /** Test seam for the per-minute `arcjet_denied` sampler. */
  sampleDeniedLog?: () => boolean;
  /** Where a DENY is enforced. */
  enforcement?: ArcjetEnforcement;
  /** Test seam for the clock that times the Arcjet call (ms). */
  now?: () => number;
  /** Test seam for the event-loop delay read on a failure (ms). */
  eventLoopDelay?: () => number | undefined;
}

export function createArcjetProtect(
  client: ArcjetClientLike | undefined,
  options: ArcjetProtectOptions = {},
) {
  const sampleHeaderLog =
    options.sampleHeaderLog ??
    createMinuteSampler(FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
  const sampleDeniedLog =
    options.sampleDeniedLog ?? createMinuteSampler(DENIED_LOG_MAX_PER_MINUTE);
  const enforcement = options.enforcement ?? ARCJET_ENFORCEMENT;
  const now = options.now ?? (() => performance.now());
  const eventLoopDelay = options.eventLoopDelay ?? eventLoopDelayMs;
  let deniedSampledOut = 0;

  function logFingerprintFailed(
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
    detail: {
      conclusion: string;
      errorType: string;
      message: string;
      decisionId?: string;
      startedAt: number;
    },
  ) {
    const { startedAt, ...rest } = detail;
    // A call that took far longer than ARCJET_TIMEOUT_MS, or a large
    // event-loop delay, means our process was too busy to read the answer in
    // time, not that Arcjet was slow (ISS-1739).
    const base = {
      ...requestContext(request, pathName),
      ...rest,
      durationMs: Math.round(now() - startedAt),
      eventLoopDelayMs: eventLoopDelay(),
    };
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
      ...requestContext(request, pathName),
      ipSrc: ipSrc ? maskIp(ipSrc) : 'none',
      doConnectingIp: maskIp(request.headers.get('do-connecting-ip') ?? ''),
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

  function logDenied(log: ArcjetLog, data: Record<string, unknown>) {
    if (!sampleDeniedLog()) {
      deniedSampledOut += 1;
      return;
    }
    log('warn', 'arcjet_denied', {
      ...data,
      sampledOutSinceLast: deniedSampledOut,
    });
    deniedSampledOut = 0;
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
    const startedAt = now();
    try {
      decision = await client.protect(request, protectOptions);
    } catch (error) {
      // Fail open: a protection outage must never take the site down.
      logFingerprintFailed(request, pathName, log, {
        conclusion: 'THREW',
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        startedAt,
      });
      return { denied: false, conclusion: 'THREW' };
    }

    if (decision.isDenied()) {
      const deniedBots = deniedBotsOf(decision);
      const enforced = isEnforcedHost(request, enforcement);
      const reasonType = decision.reason.type ?? 'unknown';
      logDenied(log, {
        ...requestContext(request, pathName),
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
      // Includes a Decide API timeout (ARCJET_TIMEOUT_MS): fail open.
      logFingerprintFailed(request, pathName, log, {
        conclusion: decision.conclusion,
        errorType: decision.reason.type,
        message: errorMessageOf(decision),
        decisionId: decision.id,
        startedAt,
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

  /** `enforcement` is exposed so callers/tests can see what is in effect. */
  return Object.assign(arcjetProtect, { enforcement });
}

/**
 * Default Decide API timeout. Arcjet targets about 30 ms per decision, and
 * the page waits for the decision before it fetches data, so this is the
 * worst-case added latency when Arcjet is slow. On timeout the decision
 * errors and the page fails open (served, logged as
 * `arcjet_fingerprint_failed`).
 */
export const ARCJET_DEFAULT_TIMEOUT_MS = 500;

/** `ARCJET_TIMEOUT_MS` as a positive integer, else the default. */
export function parseTimeoutMs(value: string | undefined): number {
  const ms = Number(value);
  return Number.isInteger(ms) && ms > 0 ? ms : ARCJET_DEFAULT_TIMEOUT_MS;
}

export const ARCJET_TIMEOUT_MS = parseTimeoutMs(process.env.ARCJET_TIMEOUT_MS);

const arcjetKey = process.env.ARCJET_KEY;

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      client: createRemoteClient({ timeout: ARCJET_TIMEOUT_MS }),
      proxies: ARCJET_PROXIES,
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
