import { Counter, Histogram, register } from 'prom-client';

/**
 * Arcjet decisions as Prometheus metrics, on the default registry that
 * `/api/metrics` serves next to `collectDefaultMetrics` (ISS-1739).
 *
 * The logs only show denials and failures, so the request rate and the
 * latency distribution of the Decide call are otherwise unknown. A counter
 * by conclusion and a histogram of the call time give both, in a form that
 * aggregates across instances once the app is scraped (ISS-1732).
 *
 * Looked up by name before creation: Next.js re-evaluates modules in dev,
 * and registering the same metric twice throws.
 */

const DECISIONS = 'norse_arcjet_decisions_total';
const DURATION = 'norse_arcjet_decision_duration_seconds';

export const arcjetDecisions =
  (register.getSingleMetric(DECISIONS) as Counter<'conclusion'> | undefined) ??
  new Counter({
    name: DECISIONS,
    help: 'Arcjet decisions by conclusion (ArcjetProtectResult.conclusion).',
    labelNames: ['conclusion'],
  });

export const arcjetDecisionDuration =
  (register.getSingleMetric(DURATION) as Histogram<'conclusion'> | undefined) ??
  new Histogram({
    name: DURATION,
    help: 'Wall time of one Arcjet Decide call, by conclusion. ARCJET_TIMEOUT_MS is 0.5 s.',
    labelNames: ['conclusion'],
    // Default buckets; 0.5 is the timeout, and anything past it is the
    // event loop, not Arcjet.
  });
