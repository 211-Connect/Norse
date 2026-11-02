import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { after, before, describe, it } from 'node:test';

import {
  type Context,
  ROOT_CONTEXT,
  context,
  metrics,
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

import {
  arcjetSpanAttributes,
  isArcjetErrorConclusion,
  recordArcjetDecision,
} from '../src/lib/telemetry/arcjet';
import { markTelemetryReady } from '../src/lib/telemetry/meter';
import {
  limitBucket,
  recordSearch,
  searchSpanAttributes,
  type SearchObservation,
} from '../src/lib/telemetry/search';
import { clearMemoryCache, withCache } from '../src/utilities/withCache';

/**
 * N5: Arcjet and search counters, span enrichment, and the privacy guard that
 * keeps the search text out of every recorded attribute.
 */

delete process.env.CACHE_REDIS_URI;

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
const tracer = tracerProvider.getTracer('n5-test');

before(() => {
  // The API's default context manager is a no-op, so `trace.getActiveSpan()`
  // would never see a span. Mirrors tests/trace-context.test.ts.
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
});

after(async () => {
  await meterProvider.shutdown();
  await tracerProvider.shutdown();
  metrics.disable();
  context.disable();
});

type ExportedMetric = {
  descriptor: { name: string };
  dataPointType: DataPointType;
  dataPoints: {
    attributes: Record<string, unknown>;
    value: number;
  }[];
};

function exportedMetrics(): ExportedMetric[] {
  // Only sums (counters) are recorded by the code under test here.
  return metricExporter
    .getMetrics()
    .flatMap((resourceMetrics) => resourceMetrics.scopeMetrics)
    .flatMap((scopeMetrics) => scopeMetrics.metrics)
    .filter((metric) => metric.dataPointType === DataPointType.SUM)
    .map((metric) => metric as unknown as ExportedMetric);
}

function metricNamed(name: string): ExportedMetric {
  const metric = exportedMetrics().find(
    (candidate) => candidate.descriptor.name === name,
  );
  assert.ok(metric, `metric ${name} was exported`);
  return metric as ExportedMetric;
}

describe('search page-size buckets', () => {
  it('maps the page size to the fixed le25/le50/gt50 buckets', () => {
    assert.equal(limitBucket(0), 'le25');
    assert.equal(limitBucket(25), 'le25');
    assert.equal(limitBucket(26), 'le50');
    assert.equal(limitBucket(50), 'le50');
    assert.equal(limitBucket(51), 'gt50');
    assert.equal(limitBucket(500), 'gt50');
  });
});

describe('arcjet decision counter', () => {
  it('records conclusion and enforced as fixed attribute values', async () => {
    recordArcjetDecision('ALLOW', true);
    recordArcjetDecision('THREW', false);
    recordArcjetDecision('ERROR', false);

    await meterProvider.forceFlush();

    const metric = metricNamed('norse.arcjet.decisions');
    assert.equal(metric.dataPointType, DataPointType.SUM);
    const points = metric.dataPoints.map((point) => ({
      attributes: point.attributes,
      value: point.value,
    }));
    assert.deepEqual(points, [
      { attributes: { conclusion: 'ALLOW', enforced: 'true' }, value: 1 },
      { attributes: { conclusion: 'THREW', enforced: 'false' }, value: 1 },
      { attributes: { conclusion: 'ERROR', enforced: 'false' }, value: 1 },
    ]);
  });

  it('marks only ERROR and THREW as failed decisions', () => {
    assert.equal(isArcjetErrorConclusion('ERROR'), true);
    assert.equal(isArcjetErrorConclusion('THREW'), true);
    for (const conclusion of [
      'ALLOW',
      'CHALLENGE',
      'SKIPPED',
      'NO_CLIENT_IP',
      'DENIED_NOT_ENFORCED',
      'DENY',
    ] as const) {
      assert.equal(isArcjetErrorConclusion(conclusion), false, conclusion);
    }
  });

  it('builds span attributes from the decision id and timing only', () => {
    assert.deepEqual(
      arcjetSpanAttributes({
        conclusion: 'ALLOW',
        decisionId: 'lreq_01',
        timing: { durationMs: 42, eventLoopUtilization: 0.125 },
      }),
      {
        'arcjet.decision_id': 'lreq_01',
        'event_loop.utilization': 0.125,
        'arcjet.duration_ms': 42,
      },
    );

    // A thrown call has timing but no decision id.
    assert.deepEqual(
      arcjetSpanAttributes({
        conclusion: 'THREW',
        timing: { durationMs: 501, eventLoopUtilization: 0.02 },
      }),
      {
        'event_loop.utilization': 0.02,
        'arcjet.duration_ms': 501,
      },
    );
  });
});

describe('search request counter', () => {
  it('records api, cache_hit and the limit bucket', async () => {
    const base = {
      engine: 'classic',
      page: 1,
      results: 3,
      totalResults: 30,
    } satisfies Omit<SearchObservation, 'api' | 'limit' | 'cacheHit'>;

    recordSearch({ ...base, api: 'v2', limit: 30, cacheHit: false });
    recordSearch({ ...base, api: 'v1', limit: 25, cacheHit: true });

    await meterProvider.forceFlush();

    const metric = metricNamed('norse.search.requests');
    const points = metric.dataPoints.map((point) => ({
      attributes: point.attributes,
      value: point.value,
    }));
    assert.deepEqual(points, [
      {
        attributes: { api: 'v2', cache_hit: 'false', limit: 'le50' },
        value: 1,
      },
      { attributes: { api: 'v1', cache_hit: 'true', limit: 'le25' }, value: 1 },
    ]);
  });
});

describe('search span privacy', () => {
  const SEARCH_TEXT = 'CRISIS-SEARCH-TEXT-9f3a';
  const LOCATION = 'LOCATION-TEXT-17b2';

  /**
   * Whatever the caller passes, only the allowlisted fields may be recorded.
   * The extra fields here stand in for the real search state, which carries
   * the query, location, coordinates, taxonomy and filters.
   */
  const observation = {
    api: 'v2',
    engine: 'hybrid',
    page: 2,
    limit: 50,
    results: 10,
    totalResults: 480,
    cacheHit: true,
    query: SEARCH_TEXT,
    queryLabel: SEARCH_TEXT,
    location: LOCATION,
    coordinates: [44.98, -93.27],
    taxonomy: [SEARCH_TEXT],
    filters: { service: [SEARCH_TEXT] },
  } as unknown as SearchObservation;

  it('records only the allowlisted span attributes', async () => {
    spanExporter.reset();

    const spanEnded = Promise.withResolvers<void>();
    tracer.startActiveSpan('search test', (span) => {
      recordSearch(observation);
      span.end();
      spanEnded.resolve();
    });
    await spanEnded.promise;

    const [span] = spanExporter.getFinishedSpans();
    assert.ok(span);
    assert.deepEqual(span.attributes, {
      'search.api': 'v2',
      'search.engine': 'hybrid',
      'search.page': 2,
      'search.limit': 50,
      'search.results': 10,
      'search.total_results': 480,
      'search.cache_hit': true,
    });
  });

  it('never writes the query, location, coordinates, taxonomy or filters', () => {
    const serialized = JSON.stringify({
      attributes: searchSpanAttributes(observation),
      spans: spanExporter.getFinishedSpans().map((span) => span.attributes),
      metrics: exportedMetrics().map((metric) => metric.dataPoints),
    });

    // The search text, location and coordinates are the sensitive values;
    // the exact-key assertion above already proves no extra field was added.
    for (const forbidden of [SEARCH_TEXT, LOCATION, 44.98, -93.27]) {
      assert.equal(
        serialized.includes(String(forbidden)),
        false,
        `telemetry output contains ${String(forbidden)}`,
      );
    }
  });
});

describe('withCache onResult', () => {
  it('reports a miss, then a hit served from memory', async () => {
    clearMemoryCache();
    const key = 'search_config:onresult:en' as const;
    let fetches = 0;
    const hits: boolean[] = [];
    const onResult = (hit: boolean) => hits.push(hit);
    const config = { redis: false, memory: true, ttl: 60 };

    const first = await withCache(
      key,
      async () => {
        fetches += 1;
        return { value: 1 };
      },
      config,
      undefined,
      onResult,
    );
    const second = await withCache(
      key,
      async () => {
        fetches += 1;
        return { value: 2 };
      },
      config,
      undefined,
      onResult,
    );

    assert.deepEqual(first, { value: 1 });
    assert.deepEqual(second, { value: 1 });
    assert.equal(fetches, 1);
    assert.deepEqual(hits, [false, true]);
  });

  it('leaves callers without onResult unchanged', async () => {
    clearMemoryCache();
    const key = 'search_config:onresult-none:en' as const;

    const value = await withCache(key, async () => ({ value: 3 }), {
      redis: false,
      memory: true,
      ttl: 60,
    });

    assert.deepEqual(value, { value: 3 });
  });
});
