import {
  type Attributes,
  type Context,
  type Link,
  SpanKind,
  trace,
} from '@opentelemetry/api';
import {
  ParentBasedSampler,
  type Sampler,
  SamplingDecision,
  type SamplingResult,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';

/**
 * Ratio used when `OTEL_TRACES_SAMPLER_ARG` is unset or invalid: the
 * production value, so a component that forgot the variable does not
 * silently trace every request. Dev opts in to `1` explicitly.
 */
export const DEFAULT_TRACE_SAMPLE_RATIO = 0.1;

export type TraceSampleRatio = Readonly<{
  ratio: number;
  /** Why the raw value was not used; unset when it was. */
  fallbackReason?: 'unset' | 'invalid';
}>;

/** Reads `OTEL_TRACES_SAMPLER_ARG`: a number in [0, 1], else the default. */
export function traceSampleRatio(raw: string | undefined): TraceSampleRatio {
  const value = raw?.trim();
  if (!value) {
    return { ratio: DEFAULT_TRACE_SAMPLE_RATIO, fallbackReason: 'unset' };
  }
  const ratio = Number(value);
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    return { ratio: DEFAULT_TRACE_SAMPLE_RATIO, fallbackReason: 'invalid' };
  }
  return { ratio };
}

/**
 * Health endpoints, also behind a base path (MBOA serves
 * `/adresources/api/health/`). Next.js starts the request span with
 * `http.target` = the raw request URL, query string included.
 */
const HEALTH_CHECK_PATH = /(?:^|\/)api\/healthz?\/?$/;

export function isHealthCheckTarget(target: unknown): boolean {
  if (typeof target !== 'string') return false;
  const path = target.split(/[?#]/, 1)[0];
  return HEALTH_CHECK_PATH.test(path);
}

/**
 * Never records a request to `/api/health` or `/api/healthz`. DO App Platform
 * probes every instance every few seconds; at any ratio those traces only
 * add noise and storage, and the probes are already measured by the platform.
 * Dropping the root span drops the whole trace: its children (Redis, Postgres)
 * follow the parent's decision. Everything else goes to `delegate`.
 */
export class HealthCheckDroppingSampler implements Sampler {
  constructor(private readonly delegate: Sampler) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    if (
      spanKind === SpanKind.SERVER &&
      !trace.getSpanContext(context) &&
      isHealthCheckTarget(attributes['http.target'] ?? attributes['url.path'])
    ) {
      return { decision: SamplingDecision.NOT_RECORD };
    }
    return this.delegate.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links,
    );
  }

  toString(): string {
    return `HealthCheckDroppingSampler{${this.delegate.toString()}}`;
  }
}

/** The process sampler: health checks dropped, then parent-based ratio. */
export function createTraceSampler(ratio: number): Sampler {
  return new HealthCheckDroppingSampler(
    new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(ratio) }),
  );
}
