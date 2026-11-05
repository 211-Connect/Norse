import type { Attributes } from '@opentelemetry/api';

import { lazy } from './meter';

/**
 * Arcjet decision telemetry (plan N5).
 *
 * One `norse.arcjet.decisions` sample per decision, with a fixed `conclusion`
 * enum and the enforcement flag, so the Decide API timeout ratio can be read
 * next to the process's event-loop metrics.
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
}));

/** Records one decision. Never throws. */
export function recordArcjetDecision(
  conclusion: ArcjetConclusion,
  enforced: boolean,
): void {
  try {
    instruments().decisions.add(1, {
      conclusion,
      enforced: enforced ? 'true' : 'false',
    });
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
 * The decision details added to the `arcjet.protect` span. The client IP,
 * headers and host are deliberately absent.
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
