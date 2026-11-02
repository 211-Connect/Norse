import {
  type Context,
  ROOT_CONTEXT,
  type TextMapPropagator,
  context,
  trace,
} from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { before, describe, test } from 'node:test';

import { defaultSchedule } from '../src/lib/blocked-traffic-counter';
import {
  InboundIgnoringTraceContextPropagator,
  inNewTrace,
} from '../src/lib/tracing';
import { tracedTask } from '../src/payload/jobs/tracedTask';

const exporter = new InMemorySpanExporter();
const tracer = trace.getTracer('test');

before(() => {
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
  trace.setGlobalTracerProvider(
    new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    }),
  );
});

/** Runs `fn` inside a span, as if a request were in progress. */
function inRequest<T>(fn: (requestTraceId: string) => T): T {
  return tracer.startActiveSpan('request', (span) => {
    try {
      return fn(span.spanContext().traceId);
    } finally {
      span.end();
    }
  });
}

describe('background work does not join the request that armed it', () => {
  test('the blocked-traffic flush timer runs outside any trace', async () => {
    const activeSpan = await inRequest(
      () =>
        new Promise((resolve) => {
          defaultSchedule(() => resolve(trace.getActiveSpan()), 1);
        }),
    );
    assert.equal(activeSpan, undefined);
  });

  test('inNewTrace starts a new trace under a parentless span', async () => {
    const [requestTraceId, jobTraceId] = await inRequest((requestId) =>
      inNewTrace('job', async () => [
        requestId,
        trace.getActiveSpan()?.spanContext().traceId,
      ]),
    );
    assert.ok(jobTraceId);
    assert.notEqual(jobTraceId, requestTraceId);
    const span = exporter.getFinishedSpans().find((s) => s.name === 'job');
    assert.equal(span?.parentSpanContext, undefined);
  });

  test('tracedTask names the span and passes the handler through', async () => {
    const task = tracedTask({
      slug: 'warmCache',
      handler: async () => ({ output: { traced: !!trace.getActiveSpan() } }),
    } as never) as unknown as {
      handler: (args: unknown) => Promise<{ output: { traced: boolean } }>;
    };
    assert.deepEqual(await task.handler({}), { output: { traced: true } });
    assert.ok(
      exporter.getFinishedSpans().some((s) => s.name === 'job warmCache'),
    );
  });
});

describe('InboundIgnoringTraceContextPropagator', () => {
  const propagator: TextMapPropagator =
    new InboundIgnoringTraceContextPropagator();
  const getter = {
    get: (carrier: Record<string, string>, key: string) => carrier[key],
    keys: (carrier: Record<string, string>) => Object.keys(carrier),
  };

  test('ignores an inbound traceparent', () => {
    const extracted = propagator.extract(
      ROOT_CONTEXT,
      {
        traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      },
      getter,
    );
    assert.equal(trace.getSpanContext(extracted), undefined);
  });

  test('still injects traceparent on outgoing calls', () => {
    const carrier: Record<string, string> = {};
    inRequest((requestTraceId) => {
      propagator.inject(context.active(), carrier, {
        set: (c: Record<string, string>, k, v) => {
          c[k] = v;
        },
      });
      assert.match(carrier.traceparent, new RegExp(`^00-${requestTraceId}-`));
    });
  });
});
