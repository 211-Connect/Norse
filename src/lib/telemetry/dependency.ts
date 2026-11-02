import { lazy } from './meter';

export type Outcome = 'ok' | 'error' | 'timeout';

/**
 * The fixed set of downstream dependencies Norse calls from the server.
 * Prometheus label values must come from this list only (plan rule 9).
 */
export const DEPENDENCIES = [
  'norse_api',
  'arcjet',
  'redis',
  'payload_api',
  'keycloak',
  'umami',
  'ems',
  'webhook',
  'translation',
  'other',
] as const;

export type Dependency = (typeof DEPENDENCIES)[number];

/**
 * Fixed operations per dependency, mirroring the verified call sites in the
 * plan (§1.5). Unknown calls must map to `other`.
 */
export const OPERATIONS = {
  norse_api: [
    'search_v1',
    'search_v2',
    'search_predict',
    'search_rerank',
    'resource_get',
    'resource_titles',
    'suggestion',
    'taxonomy',
    'geocoding',
    'organization',
    'service',
    'favorite',
    'printable_directory',
    'analytics',
    'cms_config',
    'other',
  ],
  arcjet: ['decide'],
  redis: ['get', 'set', 'incr', 'del'],
  payload_api: ['tenant_basic_config', 'auth_session'],
  keycloak: ['token', 'users_count', 'realm_get', 'realm_update', 'other'],
  umami: ['auth_verify', 'auth_login', 'team_get', 'website_create'],
  ems: ['share'],
  webhook: ['alert'],
  translation: ['azure', 'google'],
  other: ['other'],
} as const satisfies Record<Dependency, readonly string[]>;

export type OperationFor<D extends Dependency> =
  (typeof OPERATIONS)[D][number];

/** Any operation value an instrumented call may report. */
export type Operation = OperationFor<Dependency>;

/**
 * Returns `candidate` when it is a known operation for `dependency`, else
 * `other`. Keeps cardinality bounded when callers pass dynamic strings.
 */
export function toOperation<D extends Dependency>(
  dependency: D,
  candidate: string,
): OperationFor<D> {
  const operations: readonly string[] = OPERATIONS[dependency];
  return (
    operations.includes(candidate) ? candidate : 'other'
  ) as OperationFor<D>;
}

const instruments = lazy((meter) => ({
  calls: meter.createCounter('norse.downstream.requests', {
    description: 'Calls from norse-app to downstream dependencies',
  }),
  duration: meter.createHistogram('norse.downstream.duration', {
    unit: 's',
    description:
      'Duration of downstream calls, measured in this process (includes our event-loop delay)',
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
    },
  }),
  responseParseSize: meter.createHistogram('norse.response.parse.size', {
    unit: 'By',
    description: 'Size of JSON response bodies parsed by norse-app',
  }),
}));

export function recordDependency(
  dependency: Dependency,
  operation: Operation,
  outcome: Outcome,
  seconds: number,
) {
  try {
    const attrs = { dependency, operation, outcome };
    instruments().calls.add(1, attrs);
    instruments().duration.record(seconds, attrs);
  } catch {
    // Telemetry must never throw.
  }
}

/** Records the byte size of a parsed JSON body (attributes stay small). */
export function recordResponseParseSize(
  dependency: Dependency,
  operation: Operation,
  bytes: number,
) {
  try {
    instruments().responseParseSize.record(bytes, { dependency, operation });
  } catch {
    // Telemetry must never throw.
  }
}

/**
 * Maps an HTTP status to an outcome. A `404` for `norse_api` `resource_get` is
 * a valid answer ("no such resource"), not a failure (plan N4 rule).
 */
export function classifyStatus(
  dependency: Dependency,
  operation: Operation,
  status: number,
): Outcome {
  if (status >= 500) return 'error';
  if (status >= 400) {
    return status === 404 &&
      dependency === 'norse_api' &&
      operation === 'resource_get'
      ? 'ok'
      : 'error';
  }
  return 'ok';
}

export function isTimeoutError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const name = 'name' in e && typeof e.name === 'string' ? e.name : undefined;
  const message =
    'message' in e && typeof e.message === 'string' ? e.message : '';
  return (
    name === 'TimeoutError' ||
    name === 'AbortError' ||
    /Command timed out/i.test(message)
  );
}

export async function trackDependency<T>(
  dependency: Dependency,
  operation: Operation,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  let outcome: Outcome = 'ok';
  try {
    return await fn();
  } catch (e) {
    outcome = isTimeoutError(e) ? 'timeout' : 'error';
    throw e;
  } finally {
    recordDependency(
      dependency,
      operation,
      outcome,
      (performance.now() - start) / 1000,
    );
  }
}
