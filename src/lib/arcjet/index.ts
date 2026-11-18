import arcjet, {
  type ArcjetDecision,
  type ArcjetNextRequest,
  createRemoteClient,
} from '@arcjet/next';
import { performance } from 'node:perf_hooks';

import { createLogger } from '@/lib/logger';
import { emitArcjetSdkLog } from '@/lib/telemetry/arcjet-decision-log';

import {
  type Outcome,
  recordDependency,
  toOperation,
} from '@/lib/telemetry/dependency';

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
import { buildArcjetRules, routeRules } from './rules';
import { createArcjetSdkLogger } from './sdk-log';
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
 * - `request.ts`: the request Arcjet receives (path, method, client headers).
 * - `features.ts` / `decision-sampling.ts`: the `arcjet_decision` record.
 *
 * Every decision outcome goes to the `arcjet_decision` OTel log record
 * (`src/lib/arcjet-page.ts`), never through pino. Only `arcjet_no_client_ip`
 * (MBOA) still logs masked headers through pino, at debug.
 */

export * from './client-ip';
export * from './decision-record';
export * from './decision-sampling';
export * from './enforcement';
export * from './features';
export * from './redact';
export * from './request';
export * from './rules';
export * from './sdk-log';
export type * from './types';

/**
 * Max `arcjet_no_client_ip` events carrying redacted headers per minute per
 * process. Measured 2026-10-16: ~70/min (~100k/day) on the MBOA app, so the
 * header-bearing event is sampled and the rest log without headers.
 */
export const FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE = 5;

/** Wall-clock duration and event-loop utilization of an Arcjet decision. */
export interface ArcjetTiming {
  durationMs: number;
  eventLoopUtilization: number;
}

/** Details every decision carries, whatever its conclusion. */
export interface ArcjetDecisionDetails {
  /** `decision.id`; absent when no decision came back (SKIPPED/THREW). */
  decisionId?: string;
  timing?: ArcjetTiming;
  /** `decision.reason.type` ('BOT', 'FILTER', 'ERROR', ...), or a local cause. */
  reasonType?: string;
  /** Bots the bot rules allowed (e.g. `ARCJET_SIGNALS`, a search engine). */
  allowedBots?: string[];
  botVerified?: boolean;
  botSpoofed?: boolean;
  /** Seconds Arcjet may cache this decision. */
  ttl?: number;
  /** DRY_RUN rules that would have denied. */
  dryRunMatches?: ArcjetDryRunMatch[];
  /** Error type/message when the decision failed (ERROR/THREW). */
  errorType?: string;
  errorMessage?: string;
}

export interface ArcjetDryRunMatch {
  ruleType: string;
  ruleId: string;
  matchedExpressions?: string[];
  deniedBots?: string[];
}

export type ArcjetProtectResult =
  | (ArcjetDecisionDetails & {
      denied: false;
      /**
       * `SKIPPED` = no ARCJET_KEY; `THREW` = SDK threw (failed open);
       * `NO_CLIENT_IP` = MBOA via the mn.gov proxy with no client address at
       * all (not even an internal one); deliberately allowed.
       */
      conclusion:
        'ALLOW' | 'CHALLENGE' | 'ERROR' | 'SKIPPED' | 'THREW' | 'NO_CLIENT_IP';
    })
  | (ArcjetDecisionDetails & {
      /** Denied by Arcjet but the host is not enforced (see ARCJET_ENFORCEMENT). */
      denied: false;
      conclusion: 'DENIED_NOT_ENFORCED';
      deniedBots: string[];
      /** `decision.reason.type`: 'BOT' | 'FILTER' | ... (ISS-2366). */
      reasonType: string;
    })
  | (ArcjetDecisionDetails & {
      denied: true;
      conclusion: 'DENY';
      deniedBots: string[];
      reasonType: string;
    });

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

/**
 * Options for one `protect()` call. `correlationId` and `metadata` do not
 * affect the decision; `characteristics` are custom rate-limit keys (e.g.
 * `norse_visitor`). Never put personal data in `metadata`.
 */
export interface ArcjetCallOptions {
  /** Picks the per-route rules (`routeRules`). */
  route?: string;
  correlationId?: string;
  metadata?: Record<string, string>;
  characteristics?: Record<string, string>;
}

export interface ArcjetClientLike {
  protect(
    request: ArcjetRequestLike,
    options?: {
      ipSrc?: string;
      correlationId?: string;
      metadata?: Record<string, string>;
      [characteristic: string]: unknown;
    },
    route?: string,
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

function allowedBotsOf(decision: ArcjetDecision): string[] {
  const bots = new Set<string>();
  for (const result of decision.results) {
    if (result.reason.isBot()) {
      for (const bot of result.reason.allowed) bots.add(bot);
    }
  }
  return [...bots];
}

function botFlagsOf(decision: ArcjetDecision) {
  let verified = false;
  let spoofed = false;
  for (const result of decision.results) {
    if (result.reason.isBot()) {
      verified ||= result.reason.verified;
      spoofed ||= result.reason.spoofed;
    }
  }
  return { botVerified: verified, botSpoofed: spoofed };
}

/** Details common to every conclusion with a decision. */
function detailsOf(decision: ArcjetDecision): ArcjetDecisionDetails {
  return {
    decisionId: decision.id,
    reasonType: decision.reason.type ?? 'unknown',
    allowedBots: allowedBotsOf(decision),
    ...botFlagsOf(decision),
    ttl: decision.ttl,
    dryRunMatches: dryRunMatchesOf(decision),
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
function dryRunMatchesOf(decision: ArcjetDecision): ArcjetDryRunMatch[] {
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
  /** Where a DENY is enforced. */
  enforcement?: ArcjetEnforcement;
  /** Test seam: returns a stop() that yields timing for the wrapped call. */
  startTimer?: () => () => ArcjetTiming;
}

function defaultStartTimer() {
  const start = performance.now();
  const elu = performance.eventLoopUtilization();
  return (): ArcjetTiming => ({
    durationMs: Math.round(performance.now() - start),
    eventLoopUtilization:
      Math.round(performance.eventLoopUtilization(elu).utilization * 1000) /
      1000,
  });
}

const ERROR_MESSAGE_MAX = 256;

export function createArcjetProtect(
  client: ArcjetClientLike | undefined,
  options: ArcjetProtectOptions = {},
) {
  const sampleHeaderLog =
    options.sampleHeaderLog ??
    createMinuteSampler(FINGERPRINT_HEADER_LOG_MAX_PER_MINUTE);
  const enforcement = options.enforcement ?? ARCJET_ENFORCEMENT;
  const startTimer = options.startTimer ?? defaultStartTimer;

  /**
   * One downstream sample per Arcjet decision. `SKIPPED`/`NO_CLIENT_IP`
   * return before this is called: no call happened. A failed decision that
   * reached the Decide API timeout is a timeout; any other failure is an
   * error.
   */
  function recordDecision(timing: ArcjetTiming, failed: boolean): void {
    let outcome: Outcome = 'ok';
    if (failed) {
      outcome = timing.durationMs >= ARCJET_TIMEOUT_MS ? 'timeout' : 'error';
    }
    recordDependency(
      'arcjet',
      toOperation('arcjet', 'decide'),
      outcome,
      timing.durationMs / 1000,
    );
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
      log('debug', 'arcjet_no_client_ip', {
        ...base,
        headers: redactHeaders(request.headers),
      });
    } else {
      log('debug', 'arcjet_no_client_ip_sampled_out', base);
    }
  }

  /**
   * @param pathName Path only, never the query string.
   * @param call     Route, correlation ID, metadata, characteristics.
   */
  async function arcjetProtect(
    request: ArcjetRequestLike,
    pathName: string,
    log: ArcjetLog,
    call: ArcjetCallOptions = {},
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
    let ipSrc: string | undefined;
    if (isMboaWithoutClientIp(request)) {
      ipSrc = internalIpSrc(request.headers.get('x-forwarded-for'));
      logNoClientIp(request, pathName, log, ipSrc);
      if (!ipSrc) {
        return {
          denied: false,
          conclusion: 'NO_CLIENT_IP',
          reasonType: 'NO_CLIENT_IP',
        };
      }
    }

    const protectOptions = {
      ...call.characteristics,
      ...(ipSrc !== undefined && { ipSrc }),
      ...(call.correlationId && { correlationId: call.correlationId }),
      ...(call.metadata && { metadata: call.metadata }),
    };

    // Timed scope: only the protect call itself, not the MBOA probe above.
    const stopTimer = startTimer();
    let decision: ArcjetDecision;
    try {
      decision = await client.protect(
        request,
        // No options at all when there is nothing to pass.
        Object.keys(protectOptions).length ? protectOptions : undefined,
        call.route,
      );
    } catch (error) {
      const timing = stopTimer();
      // Fail open: a protection outage must never take the site down.
      recordDecision(timing, true);
      return {
        denied: false,
        conclusion: 'THREW',
        reasonType: 'THREW',
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: (error instanceof Error
          ? error.message
          : String(error)
        ).slice(0, ERROR_MESSAGE_MAX),
        timing,
      };
    }
    const timing = stopTimer();
    const details = { ...detailsOf(decision), timing };

    if (decision.isDenied()) {
      const deniedBots = deniedBotsOf(decision);
      const enforced = isEnforcedHost(request, enforcement);
      const reasonType = decision.reason.type ?? 'unknown';
      recordDecision(timing, false);
      return enforced
        ? {
            ...details,
            denied: true,
            conclusion: 'DENY',
            deniedBots,
            reasonType,
          }
        : {
            ...details,
            denied: false,
            conclusion: 'DENIED_NOT_ENFORCED',
            deniedBots,
            reasonType,
          };
    }

    if (decision.isErrored()) {
      // Includes a Decide API timeout (ARCJET_TIMEOUT_MS): fail open.
      recordDecision(timing, true);
      return {
        ...details,
        denied: false,
        conclusion: 'ERROR',
        errorType: decision.reason.type,
        errorMessage: errorMessageOf(decision).slice(0, ERROR_MESSAGE_MAX),
      };
    }

    recordDecision(timing, false);
    return {
      ...details,
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
 * errors and the page fails open (served, recorded as an `ERROR`
 * `arcjet_decision`).
 */
export const ARCJET_DEFAULT_TIMEOUT_MS = 500;

/** `ARCJET_TIMEOUT_MS` as a positive integer, else the default. */
export function parseTimeoutMs(value: string | undefined): number {
  const ms = Number(value);
  return Number.isInteger(ms) && ms > 0 ? ms : ARCJET_DEFAULT_TIMEOUT_MS;
}

export const ARCJET_TIMEOUT_MS = parseTimeoutMs(process.env.ARCJET_TIMEOUT_MS);

const arcjetKey = process.env.ARCJET_KEY;

const sdkLogger = createLogger('arcjet');

/**
 * The SDK's own logging: debug/info to OTel only, warn/error to pino
 * (`sdk-log.ts`). Set `ARCJET_LOG_LEVEL=warn` in production.
 */
const arcjetSdkLog = createArcjetSdkLogger({
  otel: emitArcjetSdkLog,
  pino: (level, data, message) => sdkLogger[level](data, message),
});

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      client: createRemoteClient({ timeout: ARCJET_TIMEOUT_MS }),
      proxies: ARCJET_PROXIES,
      rules: buildArcjetRules(),
      log: arcjetSdkLog,
    })
  : undefined;

/** The client for one route: base rules plus `routeRules(route)`, built once. */
const routeClients = new Map<string, typeof aj>();
function clientForRoute(route: string | undefined) {
  if (!aj || !route) return aj;
  let client = routeClients.get(route);
  if (!client) {
    const extra = routeRules(route);
    client = extra.length ? (aj.withRule(extra) as unknown as typeof aj) : aj;
    routeClients.set(route, client);
  }
  return client;
}

/**
 * Run Arcjet on a page request. No-op (`SKIPPED`) without `ARCJET_KEY`.
 * Never throws.
 */
export const arcjetProtect = createArcjetProtect(
  aj && {
    // The page passes the request from `buildArcjetRequest`; the narrower
    // type here only reflects what this module reads.
    protect: (request, options, route) =>
      clientForRoute(route)!.protect(
        request as ArcjetNextRequest,
        // Custom characteristics are per route; the SDK's typed props are
        // the intersection of every rule's props.
        options as never,
      ),
  },
);
