import {
  type Attributes,
  type Context,
  type Link,
  SpanKind,
  isSpanContextValid,
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
 * Matches the health endpoints at the root of the app, behind its base path
 * (`NEXT_PUBLIC_CUSTOM_BASE_PATH`; MBOA serves `/adresources/api/health/`),
 * with or without an origin. Anchored, so `/en/api/health` or
 * `/admin/api/health` (real catch-all routes) are still traced.
 */
function healthCheckPattern(basePath: string): RegExp {
  const base = basePath
    .trim()
    .replace(/\/+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(?:https?://[^/]+)?${base}/api/healthz?/?$`);
}

/**
 * Next.js starts the request span with `http.target` = the raw request URL:
 * base path and query string included.
 */
export function isHealthCheckTarget(target: unknown, basePath = ''): boolean {
  if (typeof target !== 'string') return false;
  const path = target.split(/[?#]/, 1)[0];
  return healthCheckPattern(basePath).test(path);
}

/**
 * Never records a request to `/api/health` or `/api/healthz`. DO App Platform
 * probes every instance on its health check period (10 s for Norse); at any ratio those traces only
 * add noise and storage, and the probes are already measured by the platform.
 * Dropping the root span drops the whole trace: its children (Redis, Postgres)
 * follow the parent's decision. Everything else goes to `delegate`.
 */
export class HealthCheckDroppingSampler implements Sampler {
  private readonly healthCheck: RegExp;

  constructor(
    private readonly delegate: Sampler,
    basePath = '',
  ) {
    this.healthCheck = healthCheckPattern(basePath);
  }

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    if (spanKind === SpanKind.SERVER && isRoot(context)) {
      const target = attributes['http.target'] ?? attributes['url.path'];
      if (
        typeof target === 'string' &&
        this.healthCheck.test(target.split(/[?#]/, 1)[0])
      ) {
        return { decision: SamplingDecision.NOT_RECORD };
      }
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

/** "Root" exactly as `ParentBasedSampler` decides it: no valid parent. */
function isRoot(context: Context): boolean {
  const parent = trace.getSpanContext(context);
  return !parent || !isSpanContextValid(parent);
}

/** The process sampler: health checks dropped, then parent-based ratio. */
export function createTraceSampler(ratio: number, basePath = ''): Sampler {
  return new HealthCheckDroppingSampler(
    new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(ratio) }),
    basePath,
  );
}
