import { strict as assert } from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
import { after, before, describe, it } from 'node:test';

import {
  type Context,
  ROOT_CONTEXT,
  SpanStatusCode,
  TraceFlags,
  context,
  metrics,
  propagation,
  trace,
} from '@opentelemetry/api';
import {
  AggregationTemporality,
  DataPointType,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

import { InjectOnlyTraceContextPropagator } from '../src/instrumentation';
import { resolveApiRequest } from '../src/lib/telemetry/api-fetch';
import {
  classifyStatus,
  isTimeoutError,
  toOperation,
  trackDependency,
} from '../src/lib/telemetry/dependency';
import { injectTraceparent, spanOptionsFor } from '../src/lib/telemetry/fetch';
import { markTelemetryReady } from '../src/lib/telemetry/meter';

// N2 registers this propagator globally in `register()`; tests set it here so
// the `-00` injection path is exercised with the real propagator.
propagation.setGlobalPropagator(new InjectOnlyTraceContextPropagator());

const metricExporter = new InMemoryMetricExporter(
  AggregationTemporality.CUMULATIVE,
);
const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60_000,
    }),
  ],
});

const spanExporter = new InMemorySpanExporter();
const tracerProvider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(spanExporter)],
});
const testTracer = tracerProvider.getTracer('dependency-test');

before(() => {
  // The API's default context manager is a no-op; the SDK installs a real one
  // in the app. This mirrors tests/trace-context.test.ts.
  const storage = new AsyncLocalStorage<Context>();
  context.setGlobalContextManager({
    active: () => storage.getStore() ?? ROOT_CONTEXT,
    with: (ctx, fn, thisArg, ...args) =>
      storage.run(ctx, () => fn.apply(thisArg, args)),
    bind: (_ctx, target) => target,
    enable() {
      return this;
    },
    disable() {
      return this;
    },
  });

  metrics.setGlobalMeterProvider(meterProvider);
  markTelemetryReady();
  trace.setGlobalTracerProvider(tracerProvider);
});

after(async () => {
  await meterProvider.shutdown();
  await tracerProvider.shutdown();
  metrics.disable();
  trace.disable();
  context.disable();
});

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba90263';

function withUnsampledSpan<T>(fn: () => T): T {
  const span = trace.wrapSpanContext({
    traceId: TRACE_ID,
    spanId: SPAN_ID,
    traceFlags: TraceFlags.NONE,
    isRemote: false,
  });
  return context.with(trace.setSpan(context.active(), span), fn);
}

describe('classifyStatus', () => {
  it('maps 2xx/3xx to ok', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 200), 'ok');
    assert.equal(classifyStatus('norse_api', 'search_v1', 302), 'ok');
  });

  it('maps 5xx to error', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 500), 'error');
    assert.equal(classifyStatus('redis', 'get', 503), 'error');
  });

  it('maps 4xx to error, except a 404 resource_get', () => {
    assert.equal(classifyStatus('norse_api', 'search_v1', 404), 'error');
    assert.equal(classifyStatus('keycloak', 'token', 401), 'error');
    assert.equal(classifyStatus('norse_api', 'search_v1', 429), 'error');
    assert.equal(classifyStatus('norse_api', 'resource_get', 404), 'ok');
  });

  it('does not apply the 404 rule to another dependency', () => {
    assert.equal(classifyStatus('keycloak', 'resource_get', 404), 'error');
  });
});

describe('operation mapping', () => {
  it('resolves the search operations by method', () => {
    assert.equal(resolveApiRequest('GET', '/search').operation, 'search_v1');
    assert.equal(resolveApiRequest('POST', '/search').operation, 'search_v2');
    assert.equal(
      resolveApiRequest('GET', '/search/predict').operation,
      'search_predict',
    );
    assert.equal(
      resolveApiRequest('GET', '/search/re-rank').operation,
      'search_rerank',
    );
  });

  it('resolves resources, statics before placeholders', () => {
    assert.deepEqual(resolveApiRequest('POST', '/resource/titles'), {
      operation: 'resource_titles',
      template: '/resource/titles',
    });
    assert.deepEqual(resolveApiRequest('GET', '/resource/abc123'), {
      operation: 'resource_get',
      template: '/resource/{id}',
    });
  });

  it('strips IDs into the path template', () => {
    assert.deepEqual(
      resolveApiRequest('PATCH', '/printable-directories/42/sections/7'),
      {
        operation: 'printable_directory',
        template: '/printable-directories/{id}/sections/{sectionId}',
      },
    );
  });

  it('resolves the remaining fixed operations', () => {
    const cases: [string, string, string][] = [
      ['GET', '/suggestion/term', 'suggestion'],
      ['GET', '/taxonomy', 'taxonomy'],
      ['GET', '/geocoding/forward', 'geocoding'],
      ['GET', '/organization/service-at-location/9', 'organization'],
      ['GET', '/service/9', 'service'],
      ['GET', '/favorite-list/search', 'favorite'],
      ['DELETE', '/favorite/1/2', 'favorite'],
      ['POST', '/analytics/events', 'analytics'],
      ['POST', '/cms-config/cache/clear/tenant', 'cms_config'],
    ];
    for (const [method, path, operation] of cases) {
      assert.equal(resolveApiRequest(method, path).operation, operation);
    }
  });

  it('resolves the short-url, delivery, scorecard and tenant-config routes', () => {
    const cases: [string, string, string, string][] = [
      ['GET', '/short-url/abc123', 'short_url', '/short-url/{id}'],
      ['POST', '/short-url', 'short_url', '/short-url'],
      [
        'GET',
        '/printable-directories/42/deliveries',
        'printable_directory',
        '/printable-directories/{id}/deliveries',
      ],
      [
        'POST',
        '/printable-directories/42/deliveries',
        'printable_directory',
        '/printable-directories/{id}/deliveries',
      ],
      [
        'PATCH',
        '/printable-directories/42/deliveries/7',
        'printable_directory',
        '/printable-directories/{id}/deliveries/{deliveryId}',
      ],
      [
        'DELETE',
        '/printable-directories/42/deliveries/7',
        'printable_directory',
        '/printable-directories/{id}/deliveries/{deliveryId}',
      ],
      [
        'GET',
        '/internal/printable-directory-deliveries/due',
        'printable_directory',
        '/internal/printable-directory-deliveries/due',
      ],
      [
        'GET',
        '/internal/printable-directory-deliveries/7/preview',
        'printable_directory',
        '/internal/printable-directory-deliveries/{deliveryId}/preview',
      ],
      [
        'POST',
        '/internal/printable-directory-deliveries/7/claim',
        'printable_directory',
        '/internal/printable-directory-deliveries/{deliveryId}/claim',
      ],
      [
        'POST',
        '/internal/printable-directory-deliveries/7/result',
        'printable_directory',
        '/internal/printable-directory-deliveries/{deliveryId}/result',
      ],
      [
        'GET',
        '/taxonomy-scorecard/taxonomies',
        'taxonomy_scorecard',
        '/taxonomy-scorecard/taxonomies',
      ],
      [
        'GET',
        '/taxonomy-scorecard/tenants/acme/taxonomies/101',
        'taxonomy_scorecard',
        '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}',
      ],
      [
        'PUT',
        '/taxonomy-scorecard/tenants/acme/taxonomies/101',
        'taxonomy_scorecard',
        '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}',
      ],
      [
        'POST',
        '/taxonomy-scorecard/tenants/acme/taxonomies/101/enable',
        'taxonomy_scorecard',
        '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}/enable',
      ],
      ['GET', '/tenant-config/acme', 'tenant_config', '/tenant-config/{tenantId}'],
      [
        'GET',
        '/tenant-config/acme/topics',
        'tenant_config',
        '/tenant-config/{tenantId}/topics',
      ],
      [
        'GET',
        '/tenant-config/acme/suggestions',
        'tenant_config',
        '/tenant-config/{tenantId}/suggestions',
      ],
      ['POST', '/resource/batch', 'resource_get', '/resource/batch'],
      [
        'POST',
        '/internal/blocked-traffic',
        'blocked_traffic',
        '/internal/blocked-traffic',
      ],
    ];
    for (const [method, path, operation, template] of cases) {
      assert.deepEqual(
        resolveApiRequest(method, path),
        { operation, template },
        `${method} ${path}`,
      );
    }
  });

  it('shapes an unknown path instead of returning it raw', () => {
    // A static path with no IDs stays readable.
    assert.deepEqual(resolveApiRequest('GET', '/health'), {
      operation: 'other',
      template: '/health',
    });
    // A short code after a known collection is an id even when it is not
    // numeric and shorter than the generic id length threshold.
    assert.deepEqual(resolveApiRequest('GET', '/short-url/abc'), {
      operation: 'short_url',
      template: '/short-url/{id}',
    });
    // A segment after a known collection name is an id even when it is not
    // numeric and shorter than the generic id length threshold.
    assert.deepEqual(resolveApiRequest('GET', '/orchestration-config/abc'), {
      operation: 'other',
      template: '/orchestration-config/{id}',
    });
    for (const id of [
      '42',
      '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      'deadbeefcafe',
      'aB3xY9zKq',
    ]) {
      assert.deepEqual(
        resolveApiRequest('GET', `/unknown/${id}`),
        { operation: 'other', template: '/unknown/{id}' },
        id,
      );
    }
    assert.equal(
      resolveApiRequest('GET', '/unknown/aB3xY9zKq').template,
      '/unknown/{id}',
    );
  });
});

describe('toOperation', () => {
  it('keeps known operations and maps unknown ones to other', () => {
    assert.equal(toOperation('norse_api', 'search_v1'), 'search_v1');
    assert.equal(toOperation('norse_api', 'bogus'), 'other');
    assert.equal(toOperation('redis', 'incr'), 'incr');
    assert.equal(toOperation('redis', 'flushdb'), 'other');
  });
});

describe('isTimeoutError', () => {
  it('recognises timeouts and aborts', () => {
    assert.equal(isTimeoutError({ name: 'TimeoutError' }), true);
    assert.equal(isTimeoutError({ name: 'AbortError' }), true);
    assert.equal(isTimeoutError(new Error('Command timed out')), true);
  });

  it('rejects other failures', () => {
    assert.equal(isTimeoutError(new Error('boom')), false);
    assert.equal(isTimeoutError(undefined), false);
    assert.equal(isTimeoutError('Command timed out'), false);
  });
});

describe('traceparent injection', () => {
  it('adds a `-00` traceparent for an unsampled active context', () => {
    withUnsampledSpan(() => {
      const headers = new Headers();
      injectTraceparent(headers, 'norse_api');
      assert.equal(
        headers.get('traceparent'),
        `00-${TRACE_ID}-${SPAN_ID}-00`,
      );
    });
  });

  it('never overwrites an existing traceparent', () => {
    withUnsampledSpan(() => {
      const headers = new Headers({
        traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
      });
      injectTraceparent(headers, 'norse_api');
      assert.equal(
        headers.get('traceparent'),
        `00-${TRACE_ID}-${SPAN_ID}-01`,
      );
    });
  });

  it('does not inject for other dependencies', () => {
    withUnsampledSpan(() => {
      const headers = new Headers();
      injectTraceparent(headers, 'keycloak');
      assert.equal(headers.get('traceparent'), null);
    });
  });
});

describe('fetch span privacy', () => {
  it('keeps the query string out of the span name and attributes', () => {
    const { opentelemetry } = spanOptionsFor(
      'https://services.c211.io/norse-api/v1/search?query=crisis&coords=1,2',
      'get',
    );
    assert.ok(opentelemetry);
    assert.equal(
      opentelemetry.spanName,
      'fetch GET services.c211.io/norse-api/v1/search',
    );
    assert.deepEqual(opentelemetry.attributes, {
      'http.url': 'https://services.c211.io/norse-api/v1/search',
    });
    assert.equal(JSON.stringify(opentelemetry).includes('?'), false);
  });

  it('uses the path template and still drops the query string', () => {
    const { opentelemetry } = spanOptionsFor(
      'https://services.c211.io/norse-api/v1/resource/abc?tenant=1',
      'GET',
      '/resource/{id}',
    );
    assert.ok(opentelemetry);
    assert.equal(
      opentelemetry.spanName,
      'fetch GET services.c211.io/resource/{id}',
    );
    assert.equal(JSON.stringify(opentelemetry).includes('?'), false);
  });
});

type ExportedMetric = {
  descriptor: { name: string };
  dataPointType: DataPointType;
  dataPoints: {
    attributes: Record<string, unknown>;
    value: number;
  }[];
};

/** Recorded `outcome` values for one dependency/operation pair. */
async function recordedOutcomes(
  dependency: string,
  operation: string,
): Promise<Record<string, number>> {
  await meterProvider.forceFlush();
  const points = metricExporter
    .getMetrics()
    .flatMap((resourceMetrics) => resourceMetrics.scopeMetrics)
    .flatMap((scopeMetrics) => scopeMetrics.metrics)
    .filter(
      (metric) =>
        metric.descriptor.name === 'norse.downstream.requests' &&
        metric.dataPointType === DataPointType.SUM,
    )
    .flatMap((metric) => (metric as unknown as ExportedMetric).dataPoints)
    .filter(
      (point) =>
        point.attributes.dependency === dependency &&
        point.attributes.operation === operation,
    );

  const outcomes: Record<string, number> = {};
  for (const point of points) {
    const outcome = String(point.attributes.outcome);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + point.value;
  }
  return outcomes;
}

describe('trackDependency outcome classification', () => {
  it('records a 500 Response as outcome=error', async () => {
    const response = await trackDependency(
      'norse_api',
      'resource_titles',
      async () => new Response('upstream failed', { status: 500 }),
    );
    assert.equal(response.status, 500);
    assert.deepEqual(await recordedOutcomes('norse_api', 'resource_titles'), {
      error: 1,
    });
  });

  it('records a 200 Response as outcome=ok', async () => {
    await trackDependency(
      'norse_api',
      'search_v1',
      async () => new Response('{}', { status: 200 }),
    );
    assert.deepEqual(await recordedOutcomes('norse_api', 'search_v1'), {
      ok: 1,
    });
  });

  it('uses an explicit classifier for a non-Response result', async () => {
    await trackDependency(
      'translation',
      'azure',
      async () => ({ unexpected: true }),
      (result) => (result.unexpected ? 'error' : 'ok'),
    );
    assert.deepEqual(await recordedOutcomes('translation', 'azure'), {
      error: 1,
    });
  });

  it('keeps a thrown error as outcome=timeout for aborts', async () => {
    const error = Object.assign(new Error('aborted'), { name: 'AbortError' });
    await assert.rejects(
      trackDependency('keycloak', 'users_count', async () => {
        throw error;
      }),
      error,
    );
    assert.deepEqual(await recordedOutcomes('keycloak', 'users_count'), {
      timeout: 1,
    });
  });

  it('marks the active span ERROR for an error outcome', async () => {
    const span = testTracer.startSpan('tracked-call');
    await context.with(trace.setSpan(context.active(), span), async () => {
      await trackDependency(
        'umami',
        'auth_login',
        async () => new Response('nope', { status: 502 }),
      );
    });
    span.end();

    const finished = spanExporter
      .getFinishedSpans()
      .find((candidate) => candidate.name === 'tracked-call');
    assert.ok(finished, 'expected the tracked span');
    assert.equal(finished.status.code, SpanStatusCode.ERROR);
  });
});
