import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { AggregationType } from '@opentelemetry/sdk-metrics';

import {
  DOWNSTREAM_DURATION_BOUNDARIES,
  createNodeTelemetryOptions,
} from '../src/instrumentation.node.js';

/**
 * The Node half of `register()`: the exporter gates
 * (`OTEL_METRICS_EXPORTER`/`OTEL_LOGS_EXPORTER=none`, used until the collector
 * accepts metrics and logs) and the downstream-latency view.
 */
describe('createNodeTelemetryOptions', () => {
  afterEach(() => {
    delete process.env.OTEL_METRICS_EXPORTER;
    delete process.env.OTEL_LOGS_EXPORTER;
  });

  const setExporters = (metrics?: string, logs?: string) => {
    if (metrics === undefined) {
      delete process.env.OTEL_METRICS_EXPORTER;
    } else {
      process.env.OTEL_METRICS_EXPORTER = metrics;
    }
    if (logs === undefined) {
      delete process.env.OTEL_LOGS_EXPORTER;
    } else {
      process.env.OTEL_LOGS_EXPORTER = logs;
    }
  };

  it('configures only Postgres tracing when both exporters are none', () => {
    setExporters('none', 'none');

    const { configuration, errors } = createNodeTelemetryOptions();

    assert.deepEqual(errors, []);
    assert.equal(configuration.metricReaders, undefined);
    assert.equal(configuration.views, undefined);
    assert.equal(configuration.logRecordProcessors, undefined);
    // Query spans are a trace signal: the metrics/logs gates do not apply.
    assert.equal(configuration.instrumentations?.length, 1);
    assert.ok(configuration.instrumentations?.[0] instanceof PgInstrumentation);
    // Resource attributes are cheap and always built.
    assert.ok(configuration.attributes?.['service.instance.id']);
  });

  it('sets up the metrics pipeline (with the explicit view) and runtime metrics', () => {
    setExporters('otlp', 'none');

    const { configuration, errors } = createNodeTelemetryOptions();

    assert.deepEqual(errors, []);
    assert.equal(configuration.metricReaders?.length, 1);
    assert.equal(configuration.logRecordProcessors, undefined);

    const [view] = configuration.views ?? [];
    assert.equal(view?.instrumentName, 'norse.downstream.duration');
    assert.equal(
      view?.aggregation?.type,
      AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
    );
    if (view?.aggregation?.type === AggregationType.EXPLICIT_BUCKET_HISTOGRAM) {
      assert.deepEqual(
        view.aggregation.options?.boundaries,
        DOWNSTREAM_DURATION_BOUNDARIES,
      );
    }

    const instrumentations = configuration.instrumentations ?? [];
    assert.ok(
      instrumentations.some(
        (instrumentation) =>
          instrumentation instanceof RuntimeNodeInstrumentation,
      ),
    );
    assert.ok(
      !instrumentations.some(
        (instrumentation) => instrumentation instanceof PinoInstrumentation,
      ),
    );
  });

  it('sets up the logs pipeline and pino instrumentation', async () => {
    setExporters('none', 'otlp');

    const { configuration, errors } = createNodeTelemetryOptions();

    assert.deepEqual(errors, []);
    assert.equal(configuration.metricReaders, undefined);
    assert.equal(configuration.views, undefined);
    assert.equal(configuration.logRecordProcessors?.length, 1);

    const instrumentations = configuration.instrumentations ?? [];
    assert.ok(
      instrumentations.some(
        (instrumentation) => instrumentation instanceof PinoInstrumentation,
      ),
    );
    assert.ok(
      !instrumentations.some(
        (instrumentation) =>
          instrumentation instanceof RuntimeNodeInstrumentation,
      ),
    );

    // No interval may outlive the test process.
    await configuration.logRecordProcessors?.[0]?.shutdown();
  });

  it('traces Postgres queries without bind values, orphans or pool spans', () => {
    setExporters('none', 'none');

    const { configuration } = createNodeTelemetryOptions();
    const pg = configuration.instrumentations?.find(
      (instrumentation) => instrumentation instanceof PgInstrumentation,
    ) as PgInstrumentation | undefined;

    assert.ok(pg, 'PgInstrumentation must be registered');
    const config = pg.getConfig();
    assert.equal(config.requireParentSpan, true);
    assert.equal(config.enhancedDatabaseReporting, false);
    assert.equal(config.ignoreConnectSpans, true);
  });
});
