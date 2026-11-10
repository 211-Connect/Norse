import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { Configuration } from '@vercel/otel';

import { register } from '../src/instrumentation';
import { PrivacySpanExporter } from '../src/lib/privacy-span-exporter';
import { HealthCheckDroppingSampler } from '../src/lib/telemetry/sampler';

/**
 * `registerOTel` is the only place that decides which exporter the app's spans
 * go through. Without this test, dropping the `PrivacySpanExporter` wrapper
 * keeps every other suite green while raw query strings reach Tempo.
 */
test('register wires a single span processor wrapped in PrivacySpanExporter', () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector.invalid:4318';
  delete process.env.OTEL_EXPORTER_OTLP_USERNAME;
  delete process.env.OTEL_EXPORTER_OTLP_PASSWORD;

  let received: Configuration | string | undefined;
  register((options) => {
    received = options;
  });

  assert.ok(
    received && typeof received === 'object',
    'register must call registerOTel with the configuration object',
  );
  const { spanProcessors } = received as Configuration;
  assert.equal(
    spanProcessors?.length,
    1,
    'a single span processor, so no env exporter can bypass the wrapper',
  );

  const [processor] = spanProcessors ?? [];
  assert.ok(
    processor instanceof BatchSpanProcessor,
    'the processor must still batch',
  );

  // `BatchSpanProcessor` has no getter for its delegate exporter; `_exporter`
  // is the only handle on what it will hand the spans to.
  const { _exporter: exporter } = processor as unknown as {
    _exporter: SpanExporter;
  };
  assert.ok(
    exporter instanceof PrivacySpanExporter,
    'the delegate exporter must sanitise spans',
  );
});

test('register samples with the health-check-dropping sampler', () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector.invalid:4318';

  let received: Configuration | string | undefined;
  register((options) => {
    received = options;
  });

  const { traceSampler } = received as Configuration;
  assert.ok(
    traceSampler instanceof HealthCheckDroppingSampler,
    'DO App Platform health probes must not be traced',
  );
});
