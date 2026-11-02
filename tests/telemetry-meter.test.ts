import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  DataPointType,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import {
  isTelemetryReady,
  lazy,
  markTelemetryReady,
  norseMeter,
} from '../src/lib/telemetry/meter';

/**
 * The metrics API has no proxy provider: a Meter resolved before
 * `setGlobalMeterProvider()` is a permanent no-op. These tests pin the lazy
 * helper's contract — nothing is cached before `markTelemetryReady()`, and the
 * instrument built after it records through the real provider.
 */
describe('telemetry meter helper', () => {
  // One factory, created before the provider exists, used by both tests:
  // it must not memoise its instrument while telemetry is not ready.
  let factoryCalls = 0;
  const counter = lazy((meter) => {
    factoryCalls += 1;
    return meter.createCounter('norse_test_requests_total');
  });

  const exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );
  const provider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 60_000,
      }),
    ],
  });

  after(async () => {
    await provider.shutdown();
    metrics.disable();
  });

  it('hands out no-op instruments and caches nothing before markTelemetryReady', () => {
    // Nothing registered a provider yet: this is the API's no-op default.
    assert.equal(
      metrics.getMeterProvider().constructor.name,
      'NoopMeterProvider',
    );
    assert.equal(isTelemetryReady(), false);
    assert.equal(norseMeter().constructor.name, 'NoopMeter');

    const early = counter();
    assert.doesNotThrow(() => early.add(1));

    // Not memoised: the factory runs again because a no-op instrument must
    // not become the permanent one (the no-op meter returns a singleton, so
    // the call count — not identity — is what proves it).
    counter();
    assert.equal(factoryCalls, 2);
  });

  it('uses the real meter and memoises once markTelemetryReady has run', async () => {
    metrics.setGlobalMeterProvider(provider);
    markTelemetryReady();

    assert.equal(isTelemetryReady(), true);
    assert.equal(metrics.getMeterProvider().constructor.name, 'MeterProvider');

    const instrument = counter();
    instrument.add(2, { dependency: 'norse_api', outcome: 'ok' });
    assert.equal(factoryCalls, 3);

    // The meter and the instrument are memoised only when the provider is real.
    assert.equal(counter(), instrument);
    assert.equal(factoryCalls, 3);
    assert.equal(norseMeter(), norseMeter());

    await provider.forceFlush();

    const exported = exporter.getMetrics();
    assert.equal(exported.length, 1);
    const [metric] = exported[0].scopeMetrics[0].metrics;
    assert.equal(metric.descriptor.name, 'norse_test_requests_total');
    assert.equal(metric.dataPointType, DataPointType.SUM);
    const [point] = metric.dataPoints;
    assert.equal(point.value, 2);
    assert.deepEqual(point.attributes, {
      dependency: 'norse_api',
      outcome: 'ok',
    });
  });
});
