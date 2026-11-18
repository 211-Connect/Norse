import type { Attributes } from '@opentelemetry/api';

import { isTelemetryReady, lazy, norseMeter } from './meter';

/**
 * Arcjet decision telemetry (plan N5, spec v2 section 7).
 *
 * One `norse.arcjet.decisions` sample per decision, labelled with a fixed
 * `conclusion` enum, the enforcement flag, `reason_type`, `route`, `host`
 * and `aj_signals_present`. Host is a fine label (about 60 tenants); the user
 * agent, IP, client signature, decision ID and tenant ID never are.
 */

export type ArcjetConclusion =
  | 'ALLOW'
  | 'CHALLENGE'
  | 'ERROR'
  | 'SKIPPED'
  | 'THREW'
  | 'NO_CLIENT_IP'
  | 'DENIED_NOT_ENFORCED'
  | 'DENY';

const instruments = lazy((meter) => ({
  decisions: meter.createCounter('norse.arcjet.decisions', {
    description: 'Arcjet decisions by conclusion and enforcement',
  }),
  servedDenied: meter.createCounter('norse.arcjet.served_denied', {
    description:
      'DENIED_NOT_ENFORCED requests that were still served (what enforcing would save)',
  }),
  printRequests: meter.createCounter('norse.print.requests', {
    description: 'Printable-directory server action calls',
  }),
  pageRequests: meter.createCounter('norse.page.requests', {
    description: 'Page requests through the proxy, by returning client',
  }),
}));

export interface ArcjetDecisionLabels {
  reasonType?: string;
  route?: string;
  host?: string;
  ajSignalsPresent?: boolean;
}

/** Records one decision. Never throws. */
export function recordArcjetDecision(
  conclusion: ArcjetConclusion,
  enforced: boolean,
  labels: ArcjetDecisionLabels = {},
): void {
  try {
    const host = labels.host || 'unknown';
    const route = labels.route || 'unknown';
    instruments().decisions.add(1, {
      conclusion,
      enforced: enforced ? 'true' : 'false',
      reason_type: labels.reasonType || 'none',
      route,
      host,
      aj_signals_present: labels.ajSignalsPresent ? 'true' : 'false',
    });
    if (conclusion === 'DENIED_NOT_ENFORCED') {
      instruments().servedDenied.add(1, { host, route });
    }
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

/** One print server-action call. Never throws. */
export function recordPrintRequest(
  host: string,
  conclusion: ArcjetConclusion,
  enforced: boolean,
): void {
  try {
    instruments().printRequests.add(1, {
      host: host || 'unknown',
      conclusion,
      enforced: enforced ? 'true' : 'false',
    });
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

/** One page request seen by the proxy. Never throws. */
export function recordPageRequest(
  host: string,
  routeGroup: string,
  returning: boolean,
): void {
  try {
    instruments().pageRequests.add(1, {
      host: host || 'unknown',
      route_group: routeGroup,
      returning: returning ? 'true' : 'false',
    });
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

let burstGaugeRegistered = false;

/**
 * `norse.arcjet.burst_active{host}`: 1 while this instance has the host in
 * burst mode, 0 after. Read at collection time. Registered from
 * `register()` in `src/instrumentation.ts` right after `markTelemetryReady()`:
 * the app routes have their own copy of the meter module, where the ready
 * flag is never set. Never throws.
 */
export function registerBurstGauge(
  hosts: () => { host: string; active: boolean }[],
): void {
  if (burstGaugeRegistered || !isTelemetryReady()) return;
  try {
    norseMeter()
      .createObservableGauge('norse.arcjet.burst_active', {
        description: 'Arcjet decision-log burst mode per host (this instance)',
      })
      .addCallback((observable) => {
        for (const { host, active } of hosts()) {
          observable.observe(active ? 1 : 0, { host });
        }
      });
    burstGaugeRegistered = true;
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

/** A decision the Arcjet API failed to answer (timeout or transport error). */
export function isArcjetErrorConclusion(conclusion: ArcjetConclusion): boolean {
  return conclusion === 'ERROR' || conclusion === 'THREW';
}

export interface ArcjetSpanInput {
  conclusion: ArcjetConclusion;
  /** `decision.id`; absent when no decision came back (THREW). */
  decisionId?: string;
  timing?: { durationMs: number; eventLoopUtilization: number };
}

/**
 * The timing and decision ID on the `arcjet.protect` span. The other span
 * attributes (host, tenant, route, signature, ...) are set in
 * `src/lib/arcjet-page.ts`. The client IP, user agent and raw headers are
 * never on the span: they are in the `arcjet_decision` log record, joined by
 * `trace_id` / `decision_id`.
 */
export function arcjetSpanAttributes({
  decisionId,
  timing,
}: ArcjetSpanInput): Attributes {
  return {
    ...(decisionId !== undefined && { 'arcjet.decision_id': decisionId }),
    ...(timing !== undefined && {
      'event_loop.utilization': timing.eventLoopUtilization,
      'arcjet.duration_ms': timing.durationMs,
    }),
  };
}
