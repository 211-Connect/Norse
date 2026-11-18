import { SpanStatusCode, TraceFlags, trace } from '@opentelemetry/api';
import { createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { forbidden } from 'next/navigation';
import { after } from 'next/server';
import { cache } from 'react';

import { SESSION_ID } from '@/app/(app)/shared/lib/constants';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import {
  ARCJET_SIGNALS_COOKIE,
  type ArcjetLog,
  type ArcjetProtectResult,
  type ArcjetRoute,
  BurstDetector,
  type BuiltArcjetRequest,
  DecisionSampler,
  type RequestFeatures,
  VISITOR_CHARACTERISTIC,
  arcjetProtect,
  buildArcjetRequest,
  buildDecisionRecord,
  decisionSpanAttributes,
  dryRunKeysOf,
  isArcjetDeniedResult,
  isEnforcedHost,
  localeOfPath,
  requestFeatures,
  resolveArcjetClientIp,
  routeOfPath,
  samplingConfigFromEnv,
} from '@/lib/arcjet';
import { recordBlockedTraffic } from '@/lib/blocked-traffic';
import { createLogger } from '@/lib/logger';
import {
  arcjetSpanAttributes,
  isArcjetErrorConclusion,
  recordArcjetDecision,
  recordPrintRequest,
  registerBurstGauge,
} from '@/lib/telemetry/arcjet';
import { emitArcjetDecision } from '@/lib/telemetry/arcjet-decision-log';
import { norseDeployment } from '@/lib/telemetry/deployment';

const logger = createLogger('arcjet');

/**
 * Pino, for the few events that still go there (MBOA `arcjet_no_client_ip`
 * at debug, blocked-traffic push failures at warn). Decisions never do: they
 * are `arcjet_decision` OTel records.
 */
const log: ArcjetLog = (level, event, data) => {
  logger[level]({ event, ...data });
};

/** Per process: burst state per host, and the decision-log policy. */
const samplingConfig = samplingConfigFromEnv();
const burstDetector = new BurstDetector(samplingConfig);
const decisionSampler = new DecisionSampler(samplingConfig);

/** Everything one decision needs, read eagerly so it works in `after()`. */
interface PreparedRequest {
  built: BuiltArcjetRequest;
  features: RequestFeatures;
  route: ArcjetRoute;
  tenantId: string;
  /** Hashed session id (or client IP): the per-visitor rate-limit key. */
  visitor: string;
}

const sha12 = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 12);

/**
 * The tenant of this request, from the same app-config resolution the pages
 * use (host → resource directory → tenant). Never from the client. '' when
 * it can't be resolved.
 */
export const requestTenantId = cache(async (locale: string) => {
  try {
    const { tenantId } = await getAppConfigWithoutHost(locale || 'en');
    return tenantId && tenantId !== 'unknown' ? tenantId : '';
  } catch {
    return '';
  }
});

/**
 * The request as Arcjet should see it, once per request, path and route:
 * real path and method, client headers only, only the `aj_signals` cookie
 * (see `buildArcjetRequest`).
 */
const prepare = cache(
  async (
    path: string,
    route: ArcjetRoute,
    defaultMethod: string,
  ): Promise<PreparedRequest> => {
    const [headerList, cookieList] = await Promise.all([headers(), cookies()]);
    const built = buildArcjetRequest({
      headers: headerList,
      ajSignals: cookieList.get(ARCJET_SIGNALS_COOKIE)?.value,
      path,
      defaultMethod,
    });
    const tenantId = await requestTenantId(localeOfPath(built.context.path));
    const session = cookieList.get(SESSION_ID)?.value;
    const visitor = session
      ? `s:${sha12(session)}`
      : `i:${sha12(resolveArcjetClientIp(built.request) || 'none')}`;
    return {
      built,
      features: requestFeatures(headerList, built.context),
      route,
      tenantId,
      visitor,
    };
  },
);

const tracer = trace.getTracer('norse-app');

interface DecisionExtras {
  idsRequested?: number;
  idsUnique?: number;
}

/**
 * The Arcjet SDK calls its API over a `node:http2` Connect RPC session, not
 * the global `fetch` that @vercel/otel instruments, so the call needs a
 * manual span to show up in traces (see docs/observability.md). The
 * `arcjet_decision` record is emitted inside this span, so it carries the
 * span's `trace_id`/`span_id`/`flags`.
 */
function tracedProtect(
  prepared: PreparedRequest,
  afterResponse: boolean,
  extras: DecisionExtras = {},
) {
  return tracer.startActiveSpan('arcjet.protect', async (span) => {
    const { built, features, route, tenantId } = prepared;
    const { context } = built;
    const enforced = !afterResponse;
    span.setAttributes({
      'url.path': context.path,
      'arcjet.enforced': enforced,
    });
    try {
      registerBurstGauge(() => burstDetector.knownHosts());
      const burst = burstDetector.record(context.host);
      const spanContext = span.spanContext();
      const traceSampled =
        (spanContext.traceFlags & TraceFlags.SAMPLED) === TraceFlags.SAMPLED;

      const result = await arcjetProtect(built.request, context.path, log, {
        route,
        correlationId: trace.isSpanContextValid(spanContext)
          ? spanContext.traceId
          : undefined,
        // Never personal data: Arcjet stores metadata unredacted.
        metadata: {
          ...(tenantId && { tenant_id: tenantId }),
          route,
          deployment: norseDeployment(),
          client_signature: features.signature,
        },
        characteristics:
          route === 'print'
            ? { [VISITOR_CHARACTERISTIC]: prepared.visitor }
            : undefined,
      });

      span.setAttribute('arcjet.conclusion', result.conclusion);
      span.setAttributes(
        arcjetSpanAttributes({
          conclusion: result.conclusion,
          decisionId: result.decisionId,
          timing: result.timing,
        }),
      );
      span.setAttributes(
        decisionSpanAttributes({
          result,
          route,
          tenantId,
          context,
          features,
          burst,
        }),
      );
      // A decision the API never answered (timeout/transport error) is a
      // failed span even though the page fails open.
      if (isArcjetErrorConclusion(result.conclusion)) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      // One sample per decision, enforced or observe-only.
      recordArcjetDecision(result.conclusion, enforced, {
        reasonType: result.reasonType,
        route,
        host: context.host,
        ajSignalsPresent: context.ajSignalsPresent,
      });
      if (route === 'print') {
        recordPrintRequest(context.host, result.conclusion, enforced);
      }

      logDecision(prepared, result, enforced, burst, traceSampled, extras);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

/** Emits the `arcjet_decision` record when the sampling policy says so. */
function logDecision(
  prepared: PreparedRequest,
  result: ArcjetProtectResult,
  enforced: boolean,
  burst: boolean,
  traceSampled: boolean,
  extras: DecisionExtras,
) {
  try {
    const { built, features, route, tenantId } = prepared;
    const sampling = decisionSampler.decide({
      conclusion: result.conclusion,
      route,
      host: built.context.host,
      traceSampled,
      burst,
      reasonType: result.reasonType,
      deniedBots: isArcjetDeniedResult(result) ? result.deniedBots : undefined,
      dryRunKeys: dryRunKeysOf(result, route),
    });
    if (!sampling.log) return;
    emitArcjetDecision(
      buildDecisionRecord({
        result,
        enforced,
        route,
        tenantId,
        context: built.context,
        features,
        request: built.request,
        burst,
        sampledOutSinceLast: sampling.sampledOutSinceLast,
        ...extras,
      }),
    );
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

/**
 * One Arcjet decision; a denial, enforced or not, is also counted for the
 * Blocked Bots widget (ISS-2366). While the response is still pending the
 * count is deferred to `after()` so it never delays it; `afterResponse`
 * means we already run there and count directly.
 */
async function decideAndCount(
  prepared: PreparedRequest,
  afterResponse: boolean,
  extras?: DecisionExtras,
) {
  const result = await tracedProtect(prepared, afterResponse, extras);
  if (isArcjetDeniedResult(result)) {
    const host = prepared.built.context.host;
    const count = () => recordBlockedTraffic(host, result, log);
    if (afterResponse) await count();
    else after(count);
  }
  return result;
}

/**
 * Enforced hosts: one Arcjet decision per request and path, awaited before
 * the page renders. React `cache` is scoped to the request, so the page and
 * its `generateMetadata` share the decision: one Decide call, one record,
 * one blocked-traffic count.
 */
const decide = cache(async (pathName: string) =>
  decideAndCount(await prepare(pathName, routeOfPath(pathName), 'GET'), false),
);

/**
 * Observe-only hosts: the decision cannot change the response, so it runs
 * in `after()` and never delays the page. `cache` schedules it once per
 * request although the page and `generateMetadata` both call `protectPage`.
 * `arcjet.protect` stays a child of the request's render span there too
 * (`after()` keeps the active context); don't change how it is propagated.
 */
const observe = cache(async (pathName: string) => {
  const prepared = await prepare(pathName, routeOfPath(pathName), 'GET');
  after(() => decideAndCount(prepared, true));
});

/**
 * Bot protection for a page that serves directory data. Await it at the top
 * of the page component AND of its `generateMetadata` when that fetches
 * directory data, before any data fetch and before anything streams:
 * `forbidden()` only answers a real 403 when it is thrown before the
 * response starts. Pass the same `pathName` in both so they share one
 * decision.
 *
 * Only an enforced host (`ARCJET_ENFORCED_HOSTS`) waits for the decision:
 * on a denial this throws `forbidden()`, and `forbidden.tsx` renders the
 * branded page. On every other host the decision runs after the response,
 * so Arcjet adds no latency where a denial would only be logged. Either way
 * it fails open on a missing key or an Arcjet error.
 *
 * @param pathName  Path only, e.g. `/en/search`. Never the query string.
 */
export async function protectPage(pathName: string): Promise<void> {
  if (await isDenied(pathName)) forbidden();
}

/**
 * Bot protection for a route handler that serves directory data: whether to
 * answer 403. Same decision and enforcement as `protectPage`, which a route
 * handler can't use, as `forbidden()` only works while rendering a page.
 *
 * @param pathName  Path only, e.g. `/api/search-pins`. Never the query string.
 */
export async function isRouteDenied(pathName: string): Promise<boolean> {
  return isDenied(pathName);
}

async function isDenied(pathName: string): Promise<boolean> {
  const { built } = await prepare(pathName, routeOfPath(pathName), 'GET');
  if (!isEnforcedHost(built.request)) {
    await observe(pathName);
    return false;
  }
  return (await decide(pathName)).denied;
}

export interface ProtectActionInput {
  route: Extract<ArcjetRoute, 'print'>;
  /** Path only, e.g. `/en/search` (the page the action is posted to). */
  path: string;
  idsRequested?: number;
  idsUnique?: number;
}

export interface ProtectActionResult {
  denied: boolean;
  /** The tenant resolved on the server from the request host. */
  tenantId: string;
}

/**
 * Bot protection for a server action. Same rules as pages plus the route's
 * own (`routeRules`), with method `POST`. Every call gets an
 * `arcjet_decision` record (print is never sampled out).
 *
 * On an enforced host the decision is awaited and `denied` tells the action
 * to return an error result (never throw). On an observe-only host it runs
 * in `after()`. The tenant is resolved on the server and returned, so the
 * action never trusts the client's tenant.
 */
export async function protectAction(
  input: ProtectActionInput,
): Promise<ProtectActionResult> {
  const prepared = await prepare(input.path, input.route, 'POST');
  const extras = {
    idsRequested: input.idsRequested,
    idsUnique: input.idsUnique,
  };

  // The action's own server span, so print and favorites `/resource/batch`
  // calls can be told apart per tenant.
  trace.getActiveSpan()?.setAttributes({
    'arcjet.route': input.route,
    ...(prepared.tenantId && { 'arcjet.tenant_id': prepared.tenantId }),
  });

  if (!isEnforcedHost(prepared.built.request)) {
    after(() => decideAndCount(prepared, true, extras));
    return { denied: false, tenantId: prepared.tenantId };
  }
  const result = await decideAndCount(prepared, false, extras);
  return { denied: result.denied, tenantId: prepared.tenantId };
}
