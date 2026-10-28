import {
  context as otelContext,
  type Context,
  ROOT_CONTEXT,
  trace,
} from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, test } from 'node:test';

import {
  DEFAULT_SEARCH_LIMIT,
  normalizeLimit,
  searchJobAttributes,
  withSearchJob,
} from '../src/lib/search-job';
import { clearMemoryCache } from '../src/utilities/withCache';

/** A real tracer provider with an in-memory exporter and a context manager. */
async function withTracing<T>(
  fn: (exporter: InMemorySpanExporter) => Promise<T>,
): Promise<T> {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  trace.setGlobalTracerProvider(provider);
  const als = new AsyncLocalStorage<Context>();
  otelContext.setGlobalContextManager({
    active: () => als.getStore() ?? ROOT_CONTEXT,
    with: (ctx, f, thisArg, ...args) =>
      als.run(ctx, () => f.call(thisArg, ...args)),
    bind: (_ctx, target) => target,
    enable() {
      return this;
    },
    disable() {
      return this;
    },
  });
  try {
    return await fn(exporter);
  } finally {
    otelContext.disable();
    trace.disable();
    await provider.shutdown();
  }
}

const page = (n: number) => ({
  results: Array.from({ length: n }, (_, i) => ({ id: i })),
  totalResults: 1234,
  page: 1,
  filters: {},
});

describe('search job attributes on the active span (ISS-1739)', () => {
  test('normalizeLimit: the API default unless a positive number is given', () => {
    assert.equal(DEFAULT_SEARCH_LIMIT, 25);
    assert.equal(normalizeLimit(undefined), 25);
    assert.equal(normalizeLimit(0), 25);
    assert.equal(normalizeLimit(NaN), 25);
    assert.equal(normalizeLimit(100), 100);
  });

  test('searchJobAttributes maps every field to a search.* attribute', () => {
    assert.deepEqual(
      searchJobAttributes({
        api: 'v1',
        engine: 'classic',
        page: 2,
        limit: 100,
        results: 100,
        totalResults: 4321,
        cacheHit: false,
      }),
      {
        'search.api': 'v1',
        'search.engine': 'classic',
        'search.page': 2,
        'search.limit': 100,
        'search.results': 100,
        'search.total_results': 4321,
        'search.cache_hit': false,
      },
    );
  });

  test('a miss then a hit: the fetcher runs once and both spans say which', async () => {
    clearMemoryCache();
    await withTracing(async (exporter) => {
      const tracer = trace.getTracer('test');
      let fetches = 0;
      const run = () =>
        tracer.startActiveSpan('render', async (span) => {
          try {
            return await withSearchJob(
              'search_results:t:en:abc',
              async () => {
                fetches += 1;
                return page(100);
              },
              { redis: false, memory: true, ttl: 60 },
              (v) => v.results.length > 0,
              { api: 'v1', engine: 'classic', page: 1, limit: 100 },
            );
          } finally {
            span.end();
          }
        });

      const first = await run();
      const second = await run();

      assert.equal(first?.results.length, 100);
      assert.equal(second?.results.length, 100);
      assert.equal(fetches, 1, 'the second call is served from the cache');
      const [miss, hit] = exporter.getFinishedSpans();
      assert.equal(miss.attributes['search.cache_hit'], false);
      assert.equal(hit.attributes['search.cache_hit'], true);
      for (const s of [miss, hit]) {
        assert.equal(s.attributes['search.limit'], 100);
        assert.equal(s.attributes['search.results'], 100);
        assert.equal(s.attributes['search.total_results'], 1234);
        assert.equal(s.attributes['search.api'], 'v1');
      }
    });
  });

  test('an empty result is recorded as 0 results and not cached', async () => {
    clearMemoryCache();
    await withTracing(async (exporter) => {
      const tracer = trace.getTracer('test');
      let fetches = 0;
      const run = () =>
        tracer.startActiveSpan('render', async (span) => {
          try {
            return await withSearchJob(
              'search_results:t:en:empty',
              async () => {
                fetches += 1;
                return page(0);
              },
              { redis: false, memory: true, ttl: 60 },
              (v) => v.results.length > 0,
              { api: 'v2', engine: 'hybrid', page: 3, limit: 25 },
            );
          } finally {
            span.end();
          }
        });
      await run();
      await run();
      assert.equal(fetches, 2, 'an empty page is never cached');
      const spans = exporter.getFinishedSpans();
      assert.equal(spans.length, 2);
      assert.deepEqual(
        spans.map((s) => s.attributes['search.cache_hit']),
        [false, false],
      );
      assert.equal(spans[0].attributes['search.results'], 0);
      assert.equal(spans[0].attributes['search.page'], 3);
      assert.equal(spans[0].attributes['search.api'], 'v2');
    });
  });

  test('without a tracer provider nothing is recorded and the value still returns', async () => {
    clearMemoryCache();
    const value = await withSearchJob(
      'search_results:t:en:noop',
      async () => page(5),
      { redis: false, memory: true, ttl: 60 },
      () => true,
      { api: 'v1', engine: 'classic', page: 1, limit: 25 },
    );
    assert.equal(value?.results.length, 5);
  });
});
