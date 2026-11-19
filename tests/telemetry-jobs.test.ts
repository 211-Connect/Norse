import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { after, before, describe, it } from 'node:test';

import {
  type Context,
  ROOT_CONTEXT,
  context,
  metrics,
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

import { jobResultFor, withJobTelemetry } from '../src/lib/telemetry/jobs';
import { markTelemetryReady } from '../src/lib/telemetry/meter';

/**
 * N8: every Payload task run reports `norse.jobs.runs`,
 * `norse.jobs.duration` and `norse.jobs.last_success`, and runs under a
 * parentless `job <slug>` span.
 */

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
const tracer = tracerProvider.getTracer('n8-test');

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
  trace.setGlobalTracerProvider(tracerProvider);
  metrics.setGlobalMeterProvider(meterProvider);
  markTelemetryReady();
});

after(async () => {
  await meterProvider.shutdown();
  await tracerProvider.shutdown();
  metrics.disable();
  context.disable();
});

type DataPoint = {
  attributes: Record<string, unknown>;
  value: number | { count: number; sum: number };
};

type ExportedMetric = {
  descriptor: { name: string; unit: string };
  dataPointType: DataPointType;
  dataPoints: DataPoint[];
};

async function exportedMetrics(): Promise<ExportedMetric[]> {
  await meterProvider.forceFlush();
  // Every flush appends a ResourceMetrics snapshot; the last one is cumulative.
  const snapshots = metricExporter.getMetrics();
  const latest = snapshots[snapshots.length - 1];
  return (latest?.scopeMetrics.flatMap(
    (scopeMetrics) => scopeMetrics.metrics,
  ) ?? []) as unknown as ExportedMetric[];
}

function pointsFor(
  metricsData: ExportedMetric[],
  name: string,
  attributes: Record<string, unknown>,
): DataPoint[] {
  return (
    metricsData
      .find((metric) => metric.descriptor.name === name)
      ?.dataPoints.filter((point) =>
        Object.entries(attributes).every(
          ([key, value]) => point.attributes[key] === value,
        ),
      ) ?? []
  );
}

describe('jobResultFor', () => {
  it('treats a resolved run as success', () => {
    assert.equal(
      jobResultFor('warmCache', { output: { success: true } }),
      'success',
    );
    assert.equal(jobResultFor('warmCache', undefined), 'success');
  });

  it('treats deliverScheduledPdfs ran === false as noop', () => {
    assert.equal(
      jobResultFor('deliverScheduledPdfs', { output: { ran: false } }),
      'noop',
    );
    assert.equal(
      jobResultFor('deliverScheduledPdfs', { output: { ran: true } }),
      'success',
    );
  });
});

describe('withJobTelemetry', () => {
  it('passes arguments and output through, and counts a success', async () => {
    const args = [{ input: { tenantId: 't1' } }];
    const handler = async (received: unknown) => ({
      output: { received },
    });
    const wrapped = withJobTelemetry('warmCache', handler);

    const result = await wrapped(args[0]);
    assert.deepEqual(result, { output: { received: args[0] } });

    const exported = await exportedMetrics();

    const runs = pointsFor(exported, 'norse.jobs.runs', {
      task: 'warmCache',
      result: 'success',
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].value, 1);

    const duration = pointsFor(exported, 'norse.jobs.duration', {
      task: 'warmCache',
      result: 'success',
    });
    assert.equal(duration.length, 1);
    const histogram = duration[0].value as { count: number; sum: number };
    assert.equal(histogram.count, 1);
    assert.ok(histogram.sum >= 0);

    const lastSuccess = pointsFor(exported, 'norse.jobs.last_success', {
      task: 'warmCache',
    });
    assert.equal(lastSuccess.length, 1);
    const now = Math.floor(Date.now() / 1000);
    assert.ok(Math.abs(Number(lastSuccess[0].value) - now) < 60);
  });

  it('ends the run in its own root span even inside a request', async () => {
    const wrapped = withJobTelemetry('warmCache', async () => ({
      output: { success: true },
    }));

    await tracer.startActiveSpan('request', async (requestSpan) => {
      await wrapped(undefined);
      requestSpan.end();
    });

    const span = spanExporter
      .getFinishedSpans()
      .find((candidate) => candidate.name === 'job warmCache');
    assert.ok(span);
    assert.equal(span?.parentSpanContext, undefined);
  });

  it('records a failure and rethrows, without touching last_success', async () => {
    const wrapped = withJobTelemetry('translate', async () => {
      throw new Error('boom');
    });

    await assert.rejects(wrapped(undefined), /boom/);

    const exported = await exportedMetrics();
    const runs = pointsFor(exported, 'norse.jobs.runs', {
      task: 'translate',
      result: 'failed',
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].value, 1);

    const duration = pointsFor(exported, 'norse.jobs.duration', {
      task: 'translate',
      result: 'failed',
    });
    assert.equal((duration[0].value as { count: number }).count, 1);

    assert.equal(
      pointsFor(exported, 'norse.jobs.last_success', {
        task: 'translate',
      }).length,
      0,
    );
  });

  it('records deliverScheduledPdfs ran === false as noop, not a success', async () => {
    const wrapped = withJobTelemetry('deliverScheduledPdfs', async () => ({
      output: { ran: false, sent: 0 },
    }));

    await wrapped(undefined);

    const exported = await exportedMetrics();
    const runs = pointsFor(exported, 'norse.jobs.runs', {
      task: 'deliverScheduledPdfs',
      result: 'noop',
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].value, 1);

    assert.equal(
      pointsFor(exported, 'norse.jobs.last_success', {
        task: 'deliverScheduledPdfs',
      }).length,
      0,
    );
    assert.equal(
      pointsFor(exported, 'norse.jobs.runs', {
        task: 'deliverScheduledPdfs',
        result: 'success',
      }).length,
      0,
    );
  });

  it('records deliverScheduledPdfs ran === true as a success', async () => {
    const wrapped = withJobTelemetry('deliverScheduledPdfs', async () => ({
      output: { ran: true, sent: 2 },
    }));

    await wrapped(undefined);

    const exported = await exportedMetrics();
    const runs = pointsFor(exported, 'norse.jobs.runs', {
      task: 'deliverScheduledPdfs',
      result: 'success',
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].value, 1);

    const lastSuccess = pointsFor(exported, 'norse.jobs.last_success', {
      task: 'deliverScheduledPdfs',
    });
    assert.equal(lastSuccess.length, 1);

    const noop = pointsFor(exported, 'norse.jobs.runs', {
      task: 'deliverScheduledPdfs',
      result: 'noop',
    });
    assert.equal(noop[0].value, 1);
  });
});
