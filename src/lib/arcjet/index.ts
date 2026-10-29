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
import {
  type CircuitBreaker,
  createCircuitBreaker,
} from '@/utilities/circuitBreaker';

import { buildArcjetRules } from './rules';
import type { ArcjetLog, ArcjetRequestLike } from './types';

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

/**
 * Consecutive Arcjet API failures (timeouts, connection unavailable) that
 * open the circuit: one slow decision must not switch protection off.
 */
export const ARCJET_CIRCUIT_FAILURE_THRESHOLD = 5;
/** How long Arcjet is bypassed once the circuit opens, before one probe. */
export const ARCJET_CIRCUIT_OPEN_MS = 60_000;

/**
 * Errors that mean the Arcjet API itself is unreachable or slow, as opposed
 * to a local SDK error (e.g. a fingerprint with no client IP). The SDK
 * surfaces Connect RPC codes as `[code] message`.
 */
const ARCJET_UNAVAILABLE_ERROR = /\[(deadline_exceeded|unavailable)\]/;

export function isArcjetUnavailableError(message: string): boolean {
  return ARCJET_UNAVAILABLE_ERROR.test(message);
}

export type ArcjetProtectResult =
  | {
      denied: false;
      /**
       * `SKIPPED` = no ARCJET_KEY; `THREW` = SDK threw (failed open);
       * `NO_CLIENT_IP` = MBOA via the mn.gov proxy with no client address at
       * all (not even an internal one); deliberately allowed.
       * `BYPASSED` = not called: the Arcjet API kept failing and the circuit
       * is open (ARCJET_CIRCUIT_OPEN_MS).
       */
      conclusion:
        | 'ALLOW'
        | 'CHALLENGE'
        | 'ERROR'
        | 'SKIPPED'
        | 'THREW'
        | 'NO_CLIENT_IP'
        | 'BYPASSED';
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
  /** Test seam for the Arcjet API circuit breaker. */
  breaker?: CircuitBreaker;
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
  const breaker =
    options.breaker ??
    createCircuitBreaker({
      failureThreshold: ARCJET_CIRCUIT_FAILURE_THRESHOLD,
      openMs: ARCJET_CIRCUIT_OPEN_MS,
    });
  let deniedSampledOut = 0;

  /**
   * Report one Arcjet call to the breaker. Anything but an API timeout or
   * unavailability counts as success: a local SDK error says nothing about
   * whether the API is up.
   */
  function recordCall(log: ArcjetLog, errorMessage: string | undefined) {
    if (errorMessage !== undefined && isArcjetUnavailableError(errorMessage)) {
      const opened = breaker.recordFailure();
      if (opened) {
        log('warn', 'arcjet_circuit_open', {
          reopened: opened === 'reopened',
          openForMs: ARCJET_CIRCUIT_OPEN_MS,
          message: errorMessage,
        });
      }
      return;
    }
    const closed = breaker.recordSuccess();
    if (closed) log('warn', 'arcjet_circuit_closed', closed);
  }

  function logFingerprintFailed(
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
    detail: {
      conclusion: string;
      errorType: string;
      message: string;
      decisionId?: string;
    },
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

    // Fail open without waiting: the API kept timing out, so skip it for
    // ARCJET_CIRCUIT_OPEN_MS instead of adding a timeout to every request.
    if (!breaker.allow()) return { denied: false, conclusion: 'BYPASSED' };

    let decision: ArcjetDecision;
    try {
      decision = await client.protect(request, protectOptions);
    } catch (error) {
      recordCall(log, error instanceof Error ? error.message : String(error));
      // Fail open: a protection outage must never take the site down.
      logFingerprintFailed(request, pathName, log, {
        conclusion: 'THREW',
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      return { denied: false, conclusion: 'THREW' };
    }
    recordCall(
      log,
      decision.isErrored() ? errorMessageOf(decision) : undefined,
    );

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
