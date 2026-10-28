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
import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';

import { fetchWrapper } from '../src/app/(app)/shared/lib/fetchWrapper';
import { INSTANCE_ID, INSTANCE_STARTED_AT } from '../src/lib/instance';

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

/** A response like the search API's: 100 hits, approximately 60 kB. */
const BODY = JSON.stringify({
  search: {
    hits: {
      total: 100,
      hits: Array.from({ length: 100 }, (_, i) => ({
        _id: String(i),
        _source: { name: 'x'.repeat(500) },
      })),
    },
  },
});

describe('response.parse span (ISS-1739)', () => {
  let server: Server;
  let base: string;
  before(async () => {
    server = createServer((req, res) => {
      if (req.url?.startsWith('/missing')) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end('{"error":"no"}');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(BODY);
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  test('a parsed JSON response gets one span with its byte count and path, never the query', async () => {
    await withTracing(async (exporter) => {
      const data = await fetchWrapper<{ search: { hits: { total: number } } }>(
        `${base}/norse-api/v1/search?query=secret-crisis-query&limit=100`,
      );
      assert.equal(data?.search.hits.total, 100);
      const spans = exporter
        .getFinishedSpans()
        .filter((s) => s.name === 'response.parse');
      assert.equal(spans.length, 1);
      assert.equal(spans[0].attributes['response.parse.bytes'], BODY.length);
      assert.equal(spans[0].attributes['url.path'], '/norse-api/v1/search');
      assert.equal(
        spans[0].attributes['server.address'],
        base.replace('http://', ''),
      );
      assert.equal(
        JSON.stringify(spans[0].attributes).includes('secret'),
        false,
      );
    });
  });

  test('parseResponse: false and an error status produce no parse span', async () => {
    await withTracing(async (exporter) => {
      await fetchWrapper(`${base}/raw`, { parseResponse: false });
      await assert.rejects(fetchWrapper(`${base}/missing`));
      assert.equal(
        exporter.getFinishedSpans().filter((s) => s.name === 'response.parse')
          .length,
        0,
      );
    });
  });

  test('without a tracer provider the value still returns', async () => {
    const data = await fetchWrapper<{ search: unknown }>(`${base}/ok`);
    assert.ok(data?.search);
  });
});

describe('instance identity (ISS-1739)', () => {
  test('INSTANCE_STARTED_AT is ISO 8601, in the past, and consistent with process.uptime()', () => {
    assert.match(
      INSTANCE_STARTED_AT,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    const started = Date.parse(INSTANCE_STARTED_AT);
    const expected = Date.now() - process.uptime() * 1000;
    assert.ok(started <= Date.now());
    assert.ok(
      Math.abs(started - expected) < 2_000,
      `${started} vs ${expected}`,
    );
    assert.ok(INSTANCE_ID.length > 0);
  });
});
