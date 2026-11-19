import { strict as assert } from 'node:assert';
import { after, before, it } from 'node:test';

import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  DataPointType,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import { markTelemetryReady } from '../src/lib/telemetry/meter';
import { revokeKeycloakRefreshToken } from '../src/utilities/keycloakLogout';

/**
 * #11: the Keycloak logout call was recorded as `operation='token'`, biasing
 * token latency and the Keycloak error ratio. It is its own operation.
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

before(() => {
  metrics.setGlobalMeterProvider(meterProvider);
  markTelemetryReady();
});

after(async () => {
  await meterProvider.shutdown();
  metrics.disable();
});

type ExportedMetric = {
  descriptor: { name: string };
  dataPointType: DataPointType;
  dataPoints: {
    attributes: Record<string, unknown>;
    value: number;
  }[];
};

async function keycloakCalls(): Promise<
  { operation: string; outcome: string; value: number }[]
> {
  await meterProvider.forceFlush();
  return metricExporter
    .getMetrics()
    .flatMap((resourceMetrics) => resourceMetrics.scopeMetrics)
    .flatMap((scopeMetrics) => scopeMetrics.metrics)
    .filter(
      (metric) =>
        metric.descriptor.name === 'norse.downstream.requests' &&
        metric.dataPointType === DataPointType.SUM,
    )
    .flatMap((metric) => (metric as unknown as ExportedMetric).dataPoints)
    .filter((point) => point.attributes.dependency === 'keycloak')
    .map((point) => ({
      operation: String(point.attributes.operation),
      outcome: String(point.attributes.outcome),
      value: point.value,
    }));
}

it('records the Keycloak logout as its own operation', async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestedUrls.push(input instanceof Request ? input.url : String(input));
    return new Response('', { status: 200 });
  }) as typeof fetch;

  try {
    await revokeKeycloakRefreshToken({
      issuer: 'https://keycloak.test.invalid/realms/test',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      refreshToken: 'test-refresh-token',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestedUrls.length, 1);
  assert.ok(
    requestedUrls[0].endsWith('/protocol/openid-connect/logout'),
    requestedUrls[0],
  );

  assert.deepEqual(await keycloakCalls(), [
    { operation: 'logout', outcome: 'ok', value: 1 },
  ]);
});
